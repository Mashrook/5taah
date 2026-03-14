import { supabase } from "@/integrations/supabase/client";

type CheckoutFlow = "flight" | "hotel" | "car" | "tour" | "transfer";

export interface CreatePaymentSessionInput {
  flow: CheckoutFlow;
  amount: number;
  currency: string;
  payment_provider?: "moyasar";
  tenant_id?: string | null;
  travelers_count?: number;
  details_json?: Record<string, unknown>;
}

interface PaymentSessionResult {
  id: string;
}

export async function createPaymentSession(input: CreatePaymentSessionInput): Promise<PaymentSessionResult> {
  const payload = {
    flow: input.flow,
    amount: input.amount,
    currency: input.currency || "SAR",
    status: "initiated",
    payment_provider: input.payment_provider || "moyasar",
    tenant_id: input.tenant_id || null,
    travelers_count: input.travelers_count ?? 1,
    details_json: input.details_json || {},
  };

  const { data, error } = await supabase.functions.invoke("create-payment-session", {
    body: payload,
  });

  if (!error && data?.id) {
    return { id: String(data.id) };
  }

  // Fallback: keep local/dev environments working even if function is not deployed.
  const { data: session, error: fallbackError } = await supabase
    .from("payment_sessions")
    .insert(payload as Record<string, unknown>)
    .select("id")
    .single();

  if (fallbackError) {
    throw fallbackError;
  }

  return { id: String((session as { id: string }).id) };
}
