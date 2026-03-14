import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, Hotel } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HotelPaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [message, setMessage] = useState("");
  const [bookingRef, setBookingRef] = useState("");

  useEffect(() => {
    const verify = async () => {
      const sessionId = params.get("session");
      const paymentId = params.get("id") || params.get("payment_id");
      const paymentStatus = params.get("status");

      if (!sessionId || !paymentId) {
        setStatus("failed");
        setMessage("معرّف الجلسة أو الدفع مفقود");
        return;
      }
      if (paymentStatus && paymentStatus !== "paid") {
        setStatus("failed");
        setMessage("لم يتم الدفع بنجاح. يمكنك المحاولة مرة أخرى.");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("moyasar-verify", {
          body: { session_id: sessionId, payment_id: paymentId },
        });
        if (error) throw error;
        if (!data?.success) {
          setStatus("failed");
          setMessage(data?.error || "تعذر التحقق من الدفع");
          return;
        }
        if (typeof data.reference === "string" && data.reference) {
          setBookingRef(data.reference);
        }
        setStatus("success");
        setMessage("تم تأكيد حجز الفندق بنجاح!");
      } catch (err: unknown) {
        setStatus("failed");
        setMessage(err instanceof Error ? err.message : "حدث خطأ أثناء التحقق");
      }
    };
    verify();
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "verifying" && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold">جارٍ التحقق من الدفع...</h2>
            <p className="text-muted-foreground text-sm">يرجى الانتظار بينما نتحقق من العملية</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold">تم تأكيد الحجز! 🎉</h2>
            <p className="text-muted-foreground">{message}</p>
            {bookingRef && (
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">رقم الحجز</p>
                <p className="font-bold text-primary text-lg" dir="ltr">
                  {bookingRef}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard/bookings")}>
                عرض حجوزاتي
              </Button>
              <Button variant="gold" className="flex-1" onClick={() => navigate("/hotels")}>
                <Hotel className="w-4 h-4 ml-1" /> حجز آخر
              </Button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">لم يتم تأكيد الدفع</h2>
            <p className="text-muted-foreground">{message}</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/hotels")}>
                العودة للفنادق
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
