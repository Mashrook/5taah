import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TransferPaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [message, setMessage] = useState("");
  const [bookingRef, setBookingRef] = useState("");

  useEffect(() => {
    const verify = async () => {
      const sessionId = params.get("session");
      const paymentId = params.get("id");
      const paymentStatus = params.get("status");

      if (!sessionId) { setStatus("failed"); setMessage("معرّف الجلسة مفقود"); return; }
      if (paymentStatus !== "paid") { setStatus("failed"); setMessage("لم يتم الدفع بنجاح. يمكنك المحاولة مرة أخرى."); return; }

      try {
        const { data, error } = await supabase.functions.invoke("moyasar-verify", {
          body: { session_id: sessionId, payment_id: paymentId, flow: "transfer" },
        });
        if (error) throw error;
        if (data?.success) {
          // Create booking record
          try {
            const session = data.session;
            const details = session?.details_json || {};
            const travelers = details.travelers || [];
            const firstTraveler = travelers[0];

            const { data: booking } = await supabase
              .from("bookings")
              .insert({
                flow: "transfer",
                status: "confirmed",
                amount: session?.amount || 0,
                currency: session?.currency || "SAR",
                guest_name: firstTraveler ? `${firstTraveler.firstName} ${firstTraveler.lastName}` : null,
                guest_phone: firstTraveler?.phone || null,
                guest_email: firstTraveler?.email || null,
                user_id: session?.user_id || null,
                tenant_id: session?.tenant_id || null,
                payment_session_id: sessionId,
                payment_id: paymentId,
                details_json: details,
                travelers_json: travelers,
              } as Record<string, unknown>)
              .select("booking_ref")
              .single();

            if (booking) {
              setBookingRef((booking as { booking_ref: string }).booking_ref);
            }
          } catch {
            // Booking record creation failed but payment succeeded
          }

          setStatus("success");
          setMessage("تم تأكيد حجز النقل بنجاح!");
        } else {
          setStatus("failed");
          setMessage(data?.error || "تعذر التحقق من الدفع");
        }
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
            <h2 className="text-xl font-bold">جاري التحقق من الدفع...</h2>
            <p className="text-muted-foreground text-sm">يرجى الانتظار</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto"><CheckCircle2 className="w-10 h-10 text-emerald-500" /></div>
            <h2 className="text-2xl font-bold">تم تأكيد الحجز! 🎉</h2>
            <p className="text-muted-foreground">{message}</p>
            {bookingRef && <div className="bg-muted/30 rounded-xl p-4"><p className="text-sm text-muted-foreground">رقم الحجز</p><p className="font-bold text-primary text-lg" dir="ltr">{bookingRef}</p></div>}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard/bookings")}>عرض حجوزاتي</Button>
              <Button variant="gold" className="flex-1" onClick={() => navigate("/transfers")}><ArrowRightLeft className="w-4 h-4 ml-1" /> حجز آخر</Button>
            </div>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto"><XCircle className="w-10 h-10 text-destructive" /></div>
            <h2 className="text-2xl font-bold">لم يتم تأكيد الدفع</h2>
            <p className="text-muted-foreground">{message}</p>
            <Button variant="outline" onClick={() => navigate("/transfers")}>العودة للمواصلات</Button>
          </>
        )}
      </div>
    </div>
  );
}
