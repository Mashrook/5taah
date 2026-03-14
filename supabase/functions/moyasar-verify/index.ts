import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://5taah-production.up.railway.app";
const AMADEUS_BASE = "https://test.api.amadeus.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const allowedFlows = new Set(["flight", "hotel", "car", "tour", "transfer"]);

type SessionRow = {
  id: string;
  flow: string;
  amount: number | string;
  currency: string | null;
  user_id: string | null;
  tenant_id: string | null;
  payment_provider: string | null;
  details_json: Record<string, unknown> | null;
};

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === "object" && v !== null) as Record<string, unknown>[];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asAmount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function firstTravelerContact(details: Record<string, unknown>) {
  const travelers = asArray(details.travelers);
  const first = travelers[0] || {};
  const firstName = asString(first.firstName).trim();
  const lastName = asString(first.lastName).trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || null;
  const phone = asString(first.phone).trim() || null;
  const email = asString(first.email).trim() || null;
  return { fullName, phone, email, travelers };
}

async function getAmadeusAccessToken() {
  const clientId = Deno.env.get("AMADEUS_CLIENT_ID");
  const clientSecret = Deno.env.get("AMADEUS_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Amadeus credentials not configured");

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Amadeus OAuth failed [${res.status}]: ${errText}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

async function createFlightOrder(flightOffer: unknown, travelers: unknown[]) {
  const token = await getAmadeusAccessToken();
  const res = await fetch(`${AMADEUS_BASE}/v1/booking/flight-orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        type: "flight-order",
        flightOffers: [flightOffer],
        travelers,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Amadeus booking failed [${res.status}]: ${errText}`);
  }

  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = asObject(await req.json().catch(() => ({})));
    const sessionId = asString(body.session_id).trim();
    const paymentId = asString(body.payment_id).trim();

    if (!sessionId || !paymentId) {
      return new Response(JSON.stringify({ success: false, error: "session_id and payment_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: session, error: sessionErr } = await supabaseAdmin
      .from("payment_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionErr) throw sessionErr;
    if (!session) {
      return new Response(JSON.stringify({ success: false, error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typedSession = session as SessionRow;
    if (!allowedFlows.has(typedSession.flow)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid session flow" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const moyasarSecret = Deno.env.get("MOYASAR_SECRET_KEY");
    if (!moyasarSecret) {
      return new Response(JSON.stringify({ success: false, error: "Moyasar secret key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = btoa(`${moyasarSecret}:`);
    const pRes = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!pRes.ok) {
      const errText = await pRes.text();
      throw new Error(`Moyasar verify failed [${pRes.status}]: ${errText}`);
    }

    const payment = await pRes.json();
    const expectedAmount = Math.round(asAmount(typedSession.amount) * 100);
    if (typeof payment?.amount === "number" && payment.amount !== expectedAmount) {
      await supabaseAdmin
        .from("payment_sessions")
        .update({ payment_id: paymentId, status: "amount_mismatch" })
        .eq("id", sessionId);

      return new Response(JSON.stringify({ success: false, error: "Amount mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paid = payment?.status === "paid";
    await supabaseAdmin
      .from("payment_sessions")
      .update({ payment_id: paymentId, status: paid ? "paid" : String(payment?.status || "failed") })
      .eq("id", sessionId);

    if (!paid) {
      return new Response(JSON.stringify({ success: false, error: `Payment not paid (status=${payment?.status})` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const details = asObject(typedSession.details_json);
    const { fullName, phone, email, travelers } = firstTravelerContact(details);
    let amadeusOrderId: string | null = asString(details.amadeus_order_id) || null;

    if (typedSession.flow === "flight") {
      const pricedOffer = details.pricedOffer;
      const amadeusTravelers = details.amadeusTravelers;
      if (!pricedOffer || !Array.isArray(amadeusTravelers) || amadeusTravelers.length === 0) {
        await supabaseAdmin
          .from("payment_sessions")
          .update({ status: "paid_missing_payload" })
          .eq("id", sessionId);

        return new Response(JSON.stringify({ success: false, error: "Missing flight booking payload" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const order = await createFlightOrder(pricedOffer, amadeusTravelers as unknown[]);
      amadeusOrderId = asString(order?.data?.id) || amadeusOrderId;
    }

    const enrichedDetails: Record<string, unknown> = {
      ...details,
      flow: typedSession.flow,
      payment_provider: "moyasar",
      moyasar_payment_id: paymentId,
      amadeus_order_id: amadeusOrderId,
      verified_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from("payment_sessions")
      .update({ status: "paid_confirmed", details_json: enrichedDetails })
      .eq("id", sessionId);

    let reference = amadeusOrderId || sessionId;
    let bookingId: string | null = null;

    if (typedSession.user_id) {
      const { data: booking, error: bookingErr } = await supabaseAdmin
        .from("bookings")
        .insert({
          user_id: typedSession.user_id,
          booking_type: typedSession.flow,
          total_price: asAmount(typedSession.amount),
          currency: typedSession.currency || "SAR",
          status: "confirmed",
          payment_status: "paid",
          tenant_id: typedSession.tenant_id || null,
          details_json: enrichedDetails,
        })
        .select("id")
        .single();

      if (bookingErr) throw bookingErr;
      bookingId = asString(booking?.id) || null;
      if (bookingId) reference = bookingId;
    } else {
      const { data: guestBooking, error: guestErr } = await supabaseAdmin
        .from("guest_bookings")
        .insert({
          booking_type: typedSession.flow,
          total_price: asAmount(typedSession.amount),
          currency: typedSession.currency || "SAR",
          status: "confirmed",
          payment_status: "paid",
          payment_provider: "moyasar",
          payment_id: paymentId,
          tenant_id: typedSession.tenant_id || null,
          contact_phone: phone,
          contact_email: email,
          details_json: {
            ...enrichedDetails,
            guest_name: fullName,
            travelers,
          },
        })
        .select("id")
        .single();

      if (guestErr) throw guestErr;
      bookingId = asString(guestBooking?.id) || null;
      if (bookingId) reference = bookingId;
    }

    return new Response(
      JSON.stringify({
        success: true,
        reference,
        flow: typedSession.flow,
        booking_id: bookingId,
        session: {
          id: typedSession.id,
          flow: typedSession.flow,
          amount: asAmount(typedSession.amount),
          currency: typedSession.currency || "SAR",
          user_id: typedSession.user_id,
          tenant_id: typedSession.tenant_id,
          details_json: enrichedDetails,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
