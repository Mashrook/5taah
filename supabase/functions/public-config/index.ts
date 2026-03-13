import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
