import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("x-moyasar-signature");
    const webhookSecret = Deno.env.get("MOYASAR_WEBHOOK_SECRET");
    
    if (!signature || !webhookSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();

    // HMAC-SHA256 signature verification
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedSig) {
      console.error("❌ Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.type; // "payment.paid" or "payment.failed"
    const payment = payload.data;

    console.log("✅ Webhook received:", event, payment.id);

    // ✅ إنشاء Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (event === "payment.paid") {
      // Idempotency: skip if already processed
      const { data: existing } = await supabase
        .from("bookings")
        .select("id")
        .eq("payment_id", payment.id)
        .eq("payment_status", "paid")
        .maybeSingle();

      if (existing) {
        console.log("⏭️ Payment already processed:", payment.id);
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ✅ تحديث حالة الحجز
      const { error } = await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          payment_id: payment.id,
          paid_at: new Date().toISOString(),
        })
        .eq("payment_id", payment.id);

      if (error) {
        console.error("❌ Failed to update booking:", error);
      } else {
        console.log("✅ Booking updated successfully");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
