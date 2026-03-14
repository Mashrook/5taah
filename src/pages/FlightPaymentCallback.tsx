import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function FlightPaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = params.get("session") || "";
  const paymentId = params.get("id") || params.get("payment_id") || "";
  const paymentStatus = params.get("status") || "";

  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [bookingRef, setBookingRef] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!sessionId || !paymentId) {
        setState("error");
        setMessage("بيانات الدفع غير مكتملة. حاول إعادة المحاولة.");
        return;
      }

      if (paymentStatus && paymentStatus !== "paid") {
        setState("error");
        setMessage("لم يتم الدفع بنجاح. يمكنك المحاولة مرة أخرى.");
        return;
      }

      setState("loading");
      setMessage("");

      const { data, error } = await supabase.functions.invoke("moyasar-verify", {
        body: { session_id: sessionId, payment_id: paymentId },
      });

      if (error) {
        setState("error");
        setMessage(error.message || "تعذر التحقق من الدفع");
        return;
      }

      if (!data?.success) {
        setState("error");
        setMessage(data?.error || "فشل الدفع أو لم يتم اعتماده");
        return;
      }

      if (typeof data.reference === "string" && data.reference) {
        setBookingRef(data.reference);
      }
      setState("success");
    };

    run();
  }, [sessionId, paymentId, paymentStatus]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center" dir="rtl">
      <div className="w-full max-w-xl p-6 rounded-2xl bg-card border border-border">
        {state === "loading" && (
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <h1 className="text-xl font-bold">جارٍ التحقق من عملية الدفع…</h1>
            <p className="text-sm text-muted-foreground">لا تغلق الصفحة حتى تكتمل العملية.</p>
          </div>
        )}

        {state === "success" && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold">تم الدفع بنجاح</h1>
            <p className="text-sm text-muted-foreground">تم تأكيد الحجز بنجاح.</p>

            {bookingRef && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <p className="text-xs text-muted-foreground mb-1">رقم الحجز</p>
                <p className="font-bold text-primary text-lg" dir="ltr">
                  {bookingRef}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="gold" className="flex-1" onClick={() => navigate("/dashboard/bookings")}>
                حجوزاتي
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                الرئيسية
              </Button>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <h1 className="text-xl font-bold">تعذر إكمال الدفع</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <div className="flex gap-3">
              <Button variant="gold" className="flex-1" onClick={() => navigate("/flights")}>
                المحاولة مرة أخرى
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                الرئيسية
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
