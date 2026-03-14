// Moyasar payment verification + finalize flight booking

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://5taah-production.up.railway.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AMADEUS_BASE = "https://test.api.amadeus.com";

async function getAmadeusAccessToken() {
  const clientId = Deno.env.get("AMADEUS_CLIENT_ID");
  const clientSecret = Deno.env.get("AMADEUS_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Amadeus credentials not configured");
  }

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_id, payment_id } = await req.json().catch(() => ({}));
    if (!session_id || !payment_id) {
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
      .eq("id", session_id)
      .maybeSingle();

    if (sessionErr) throw sessionErr;
    if (!session) {
      return new Response(JSON.stringify({ success: false, error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.flow !== "flight") {
      return new Response(JSON.stringify({ success: false, error: "Invalid session flow" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const moyasarSecret = Deno.env.get("MOYASAR_SECRET_KEY");
    if (!moyasarSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Moyasar secret key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify payment with Moyasar
    const auth = btoa(`${moyasarSecret}:`);
    const pRes = await fetch(`https://api.moyasar.com/v1/payments/${payment_id}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!pRes.ok) {
      const errText = await pRes.text();
      throw new Error(`Moyasar verify failed [${pRes.status}]: ${errText}`);
    }

    const payment = await pRes.json();

    const expectedAmount = Math.round(Number(session.amount) * 100);
    if (typeof payment?.amount === "number" && payment.amount !== expectedAmount) {
      await supabaseAdmin
        .from("payment_sessions")
        .update({ payment_id, status: "amount_mismatch" })
        .eq("id", session_id);

      return new Response(JSON.stringify({ success: false, error: "Amount mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paid = payment?.status === "paid";

    await supabaseAdmin
      .from("payment_sessions")
      .update({ payment_id, status: paid ? "paid" : String(payment?.status || "failed") })
      .eq("id", session_id);

    if (!paid) {
      return new Response(
        JSON.stringify({ success: false, error: `Payment not paid (status=${payment?.status})` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pricedOffer = session.details_json?.pricedOffer;
    const amadeusTravelers = session.details_json?.amadeusTravelers;
    const rawTravelers = session.details_json?.travelers;
    const passengers = session.details_json?.passengers;

    if (!pricedOffer || !Array.isArray(amadeusTravelers) || !Array.isArray(rawTravelers) || !passengers) {
      await supabaseAdmin
        .from("payment_sessions")
        .update({ status: "paid_missing_payload" })
        .eq("id", session_id);

      return new Response(JSON.stringify({ success: false, error: "Missing booking payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Amadeus flight order AFTER payment is confirmed
    const order = await createFlightOrder(pricedOffer, amadeusTravelers);
    const amadeusOrderId = order?.data?.id || null;

    // Store booking
    const reference: string = amadeusOrderId || String(session_id);

    if (session.user_id) {
      const { error: insertErr } = await supabaseAdmin.from("bookings").insert({
        user_id: session.user_id,
        booking_type: "flight",
        total_price: session.amount,
        currency: session.currency,
        status: "confirmed",
        payment_status: "paid",
        tenant_id: session.tenant_id || null,
        details_json: {
          source: "amadeus",
          amadeus_offer_id: pricedOffer.id,
          amadeus_order_id: amadeusOrderId,
          payment_provider: "moyasar",
          moyasar_payment_id: payment_id,
          passengers,
          travelers: rawTravelers,
          pricedOffer,
        },
      });

      if (insertErr) throw insertErr;
    } else {
      const { error: insertErr } = await supabaseAdmin.from("guest_bookings").insert({
        booking_type: "flight",
        total_price: session.amount,
        currency: session.currency,
        status: "confirmed",
        payment_status: "paid",
        payment_provider: "moyasar",
        payment_id,
        tenant_id: session.tenant_id || null,
        contact_phone: rawTravelers?.[0]?.phone || null,
        contact_email: null,
        details_json: {
          source: "amadeus",
          amadeus_offer_id: pricedOffer.id,
          amadeus_order_id: amadeusOrderId,
          passengers,
          travelers: rawTravelers,
          pricedOffer,
        },
      });

      if (insertErr) throw insertErr;
    }

    return new Response(JSON.stringify({ success: true, reference }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
