import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://5taah-production.up.railway.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const allowedFlows = new Set(["flight", "hotel", "car", "tour", "transfer"]);
const allowedProviders = new Set(["moyasar"]);
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asSafeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function numberOrDefault(value: unknown, defaultValue: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return defaultValue;
  return n;
}

function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && uuidRegex.test(value);
}

async function resolveUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = asSafeObject(await req.json().catch(() => ({})));
    const flow = typeof body.flow === "string" ? body.flow : "";
    const amount = numberOrDefault(body.amount, -1);
    const currency = typeof body.currency === "string" && body.currency.trim() ? body.currency.trim().toUpperCase() : "SAR";
    const paymentProvider =
      typeof body.payment_provider === "string" && body.payment_provider.trim()
        ? body.payment_provider.trim().toLowerCase()
        : "moyasar";
    const tenantId = isValidUuid(body.tenant_id) ? body.tenant_id : null;
    const travelersCount = Math.max(1, Math.min(20, Math.round(numberOrDefault(body.travelers_count, 1))));
    const details = asSafeObject(body.details_json);

    if (!allowedFlows.has(flow)) {
      return new Response(JSON.stringify({ error: "Unsupported checkout flow" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!allowedProviders.has(paymentProvider)) {
      return new Response(JSON.stringify({ error: "Unsupported payment provider" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (amount < 0 || amount > 1_000_000) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = await resolveUserId(req.headers.get("Authorization"));

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const insertPayload = {
      flow,
      amount,
      currency,
      status: "initiated",
      payment_provider: paymentProvider,
      user_id: userId,
      tenant_id: tenantId,
      travelers_count: travelersCount,
      details_json: details,
    };

    const { data, error } = await admin
      .from("payment_sessions")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error || !data?.id) {
      return new Response(
        JSON.stringify({ error: "Failed to create payment session", detail: error?.message || "unknown" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
