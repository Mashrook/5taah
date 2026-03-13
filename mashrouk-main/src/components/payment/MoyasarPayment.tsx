import { useEffect, useRef, useState } from "react";
import { ENV } from "@/config/env";

declare global {
  interface Window {
    Moyasar: {
      init: (config: Record<string, unknown>) => void;
    };
  }
}

interface MoyasarPaymentProps {
  amount: number;
  description: string;
  callbackUrl: string;
  methods?: ("creditcard" | "applepay" | "stcpay")[];
  onInitiated?: (paymentId: string) => void;
  onCompleted?: (payment: { id: string; status: string }) => void;
  metadata?: Record<string, string>;
}

export default function MoyasarPayment({
  amount,
  description,
  callbackUrl,
  methods = ["creditcard", "applepay", "stcpay"],
  onInitiated,
  onCompleted,
  metadata,
}: MoyasarPaymentProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ جلب المفتاح من ENV
  const publishableKey = ENV.MOYASAR_PUBLISHABLE_KEY;

  useEffect(() => {
    // التحقق من وجود المفتاح
    if (!publishableKey) {
      console.error("❌ MOYASAR_PUBLISHABLE_KEY is missing");
      setError("لم يتم العثور على مفتاح الدفع. يرجى التواصل مع الدعم الفني.");
      setLoading(false);
      return;
    }

    // التحقق من تحميل Moyasar
    if (typeof window.Moyasar === "undefined") {
      console.error("❌ Moyasar script not loaded");
      setError("فشل تحميل نظام الدفع. يرجى تحديث الصفحة.");
      setLoading(false);
      return;
    }

    if (!formRef.current) return;

    // مسح النموذج السابق
    formRef.current.innerHTML = "";

    console.log("✅ Initializing Moyasar:", {
      amount: amount * 100,
      currency: "SAR",
      methods,
      hasKey: !!publishableKey,
    });

    try {
      window.Moyasar.init({
        element: formRef.current,
        amount: amount * 100,
        currency: "SAR",
        description: description,
        publishable_api_key: publishableKey,
        callback_url: callbackUrl,
        supported_networks: ["visa", "mastercard", "mada"],
        methods: methods,
        metadata: metadata || {},
        on_initiating: (payment: { id?: string }) => {
          console.log("✅ Payment initiating:", payment.id);
          if (payment.id) {
            onInitiated?.(payment.id);
          }
        },
        on_completed: (payment: { id?: string; status?: string }) => {
          console.log("✅ Payment completed:", payment);
          if (payment.id && payment.status) {
            onCompleted?.({ id: payment.id, status: payment.status });
          }
        },
        language: "ar",
      });

      setLoading(false);
      console.log("✅ Moyasar initialized successfully");
    } catch (err) {
      console.error("❌ Moyasar init error:", err);
      setError("حدث خطأ في تهيئة نظام الدفع");
      setLoading(false);
    }
  }, [publishableKey, amount, description, callbackUrl, methods, metadata, onInitiated, onCompleted]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="moyasar-payment-wrapper">
      <div ref={formRef} className="mysr-form" />
    </div>
  );
}
