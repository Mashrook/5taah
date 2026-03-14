import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://5taah-production.up.railway.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiter: max 30 requests per IP per 60 seconds
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 30;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting by IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") || "unknown";
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  // Require Supabase anon key in apikey header
  const apikey = req.headers.get("apikey");
  const expectedKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!apikey || apikey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Missing or invalid apikey" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: endpoints, error: endpointsError } = await supabaseAdmin
      .from("service_endpoints")
      .select("service, base_url, status, notes")
      .eq("status", "enabled");

    if (endpointsError) throw endpointsError;

    const { data: providerSetting } = await supabaseAdmin
      .from("site_settings")
      .select("setting_value")
      .is("tenant_id", null)
      .eq("setting_key", "payment_provider")
      .maybeSingle();

    const { data: moyasarPublishable } = await supabaseAdmin
      .from("api_keys")
      .select("key_value")
      .eq("service", "moyasar")
      .eq("key_name", "publishable_key")
      .eq("is_active", true)
      .maybeSingle();

    const { data: stripePublishable } = await supabaseAdmin
      .from("api_keys")
      .select("key_value")
      .eq("service", "stripe")
      .eq("key_name", "publishable_key")
      .eq("is_active", true)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        endpoints: endpoints || [],
        payment: {
          provider: providerSetting?.setting_value || "none",
          moyasar_publishable_key: moyasarPublishable?.key_value || null,
          stripe_publishable_key: stripePublishable?.key_value || null,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
