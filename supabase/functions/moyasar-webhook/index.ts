// Moyasar webhook handler — receives payment status notifications
// Webhook secret token must be set as MOYASAR_WEBHOOK_SECRET env var

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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
    // Verify webhook secret token
    const webhookSecret = Deno.env.get("MOYASAR_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("MOYASAR_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Moyasar sends the secret token in the request body or header
    const body = await req.json();
    const token = body?.secret || req.headers.get("X-Moyasar-Token") || "";

    if (token !== webhookSecret) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = body?.type || body?.status || "unknown";
    const paymentId = body?.id || body?.data?.id;
    const paymentStatus = body?.status || body?.data?.status;
    const amount = body?.amount || body?.data?.amount;

    console.log(`Webhook received: type=${eventType}, payment=${paymentId}, status=${paymentStatus}`);

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Missing payment ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find matching payment session
    const { data: session } = await supabaseAdmin
      .from("payment_sessions")
      .select("id, status, flow, amount, user_id")
      .eq("payment_id", paymentId)
      .maybeSingle();

    // Also check if there's a session by moyasar_payment_id in bookings
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("id, payment_status")
      .filter("details_json->>moyasar_payment_id", "eq", paymentId)
      .maybeSingle();

    const { data: guestBooking } = await supabaseAdmin
      .from("guest_bookings")
      .select("id, payment_status")
      .eq("payment_id", paymentId)
      .maybeSingle();

    // Map Moyasar status to our status
    const statusMap: Record<string, string> = {
      paid: "paid",
      captured: "paid",
      authorized: "authorized",
      failed: "failed",
      refunded: "refunded",
      voided: "voided",
      expired: "expired",
      canceled: "canceled",
    };

    const mappedStatus = statusMap[paymentStatus] || paymentStatus;

    // Update payment session if found
    if (session) {
      await supabaseAdmin
        .from("payment_sessions")
        .update({ status: mappedStatus, updated_at: new Date().toISOString() })
        .eq("id", session.id);
    }

    // Update booking if found
    if (booking) {
      const bookingUpdate: Record<string, string> = { payment_status: mappedStatus };
      if (mappedStatus === "refunded" || mappedStatus === "voided" || mappedStatus === "canceled") {
        bookingUpdate.status = "cancelled";
      }
      await supabaseAdmin
        .from("bookings")
        .update(bookingUpdate)
        .eq("id", booking.id);
    }

    // Update guest booking if found
    if (guestBooking) {
      const guestUpdate: Record<string, string> = { payment_status: mappedStatus };
      if (mappedStatus === "refunded" || mappedStatus === "voided" || mappedStatus === "canceled") {
        guestUpdate.status = "cancelled";
      }
      await supabaseAdmin
        .from("guest_bookings")
        .update(guestUpdate)
        .eq("id", guestBooking.id);
    }

    // Log the webhook event
    console.log(`Webhook processed: payment=${paymentId}, mapped_status=${mappedStatus}, session=${session?.id || "none"}, booking=${booking?.id || guestBooking?.id || "none"}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
