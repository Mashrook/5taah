import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, MapPin, CreditCard, Loader2, ChevronRight,
  Calendar, CheckCircle2, Users, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useTenantStore } from "@/stores/tenantStore";
import { supabase } from "@/integrations/supabase/client";
import TravelerForm, { type TravelerData } from "@/components/booking/TravelerForm";
import MoyasarPayment from "@/components/payment/MoyasarPayment";

type BookingStep = "traveler" | "review" | "payment";

export default function TourBooking() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const { tenant } = useTenantStore();

  const tourTitle = params.get("title") || "";
  const tourCity = params.get("city") || "";
  const tourDuration = params.get("duration") || "";
  const tourCategory = params.get("category") || "";
  const tourPrice = parseFloat(params.get("price") || "0");
  const tourCurrency = params.get("currency") || "SAR";
  const tourId = params.get("id") || "";
  const travelersCount = parseInt(params.get("travelers") || "1", 10);

  const totalPrice = tourPrice * travelersCount;

  const [step, setStep] = useState<BookingStep>("traveler");
  const [travelers, setTravelers] = useState<(TravelerData | null)[]>(Array(travelersCount).fill(null));
  const [currentTravelerIdx, setCurrentTravelerIdx] = useState(0);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [paymentPreparing, setPaymentPreparing] = useState(false);

  if (!tourTitle || !tourPrice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-xl font-bold mb-2">لم يتم اختيار جولة</p>
          <p className="text-muted-foreground mb-6">يرجى اختيار جولة من صفحة الجولات السياحية أولاً</p>
          <Button variant="gold" onClick={() => navigate("/tours")}>الجولات السياحية</Button>
        </div>
      </div>
    );
  }

  const handleTravelerSubmit = (data: TravelerData) => {
    const updated = [...travelers];
    updated[currentTravelerIdx] = data;
    setTravelers(updated);
    if (currentTravelerIdx < travelersCount - 1) {
      setCurrentTravelerIdx((i) => i + 1);
    } else {
      setStep("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGoToPayment = async () => {
    const filledTravelers = travelers.filter(Boolean) as TravelerData[];
    if (filledTravelers.length < travelersCount) return;

    if (!paymentSessionId) {
      setPaymentPreparing(true);
      try {
        const { data, error } = await supabase
          .from("payment_sessions")
          .insert({
            flow: "tour",
            amount: totalPrice,
            currency: tourCurrency,
            status: "initiated",
            payment_provider: "moyasar",
            user_id: isAuthenticated && user ? user.id : null,
            tenant_id: tenant?.id || null,
            details_json: {
              tour_id: tourId,
              tour_title: tourTitle,
              city: tourCity,
              duration: tourDuration,
              category: tourCategory,
              price_per_person: tourPrice,
              travelers_count: travelersCount,
              travelers: filledTravelers,
            },
          } as Record<string, unknown>)
          .select("id")
          .single();

        if (error) throw error;
        setPaymentSessionId((data as { id: string }).id);
      } catch (err: unknown) {
        toast({ title: "خطأ", description: err.message || "تعذر تجهيز الدفع", variant: "destructive" });
        return;
      } finally {
        setPaymentPreparing(false);
      }
    }

    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filledTravelers = travelers.filter(Boolean) as TravelerData[];

  const stepperSteps = [
    { id: "traveler" as const, label: "بيانات المسافر", icon: Users },
    { id: "review" as const, label: "مراجعة", icon: CheckCircle2 },
    { id: "payment" as const, label: "الدفع", icon: CreditCard },
  ];
  const stepOrder: BookingStep[] = ["traveler", "review", "payment"];
  const currentStepIdx = stepOrder.indexOf(step);

  return (
    <div className="min-h-screen section-padding">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Stepper */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-2 text-sm">
            {stepperSteps.map((s, idx, arr) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  step === s.id ? "bg-primary text-primary-foreground" : idx < currentStepIdx ? "bg-primary/20 text-primary" : "text-muted-foreground"
                }`}>
                  {idx < currentStepIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {idx < arr.length - 1 && <div className={`w-8 h-0.5 rounded-full ${idx < currentStepIdx ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Tour Summary */}
          <div className="rounded-2xl bg-card/70 border border-border/30 p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">{tourTitle}</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                  {tourCity && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{tourCity}</span>}
                  {tourDuration && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{tourDuration}</span>}
                  {tourCategory && <span className="bg-muted/30 px-2 py-0.5 rounded-full text-xs">{tourCategory}</span>}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{travelersCount} {travelersCount > 1 ? "مسافرين" : "مسافر"}</span>
                </div>
              </div>
              <div className="text-left shrink-0">
                <p className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{tourCurrency}</p>
              </div>
            </div>
          </div>

          {/* Step 1: Traveler */}
          {step === "traveler" && (
            <div className="space-y-4">
              {travelersCount > 1 && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                      مسافر {currentTravelerIdx + 1} من {travelersCount}
                    </span>
                    <div className="flex gap-1.5">
                      {Array.from({ length: travelersCount }).map((_, i) => (
                        <div key={i} className={`w-6 h-1.5 rounded-full transition-all ${i < currentTravelerIdx ? "bg-primary" : i === currentTravelerIdx ? "bg-primary/60" : "bg-muted"}`} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <TravelerForm
                key={currentTravelerIdx}
                onSubmit={handleTravelerSubmit}
                onBack={currentTravelerIdx === 0 ? () => navigate("/tours") : () => setCurrentTravelerIdx(i => i - 1)}
                title={travelersCount > 1 ? `بيانات المسافر ${currentTravelerIdx + 1}` : "بيانات المسافر"}
                submitLabel={currentTravelerIdx < travelersCount - 1 ? `التالي — مسافر ${currentTravelerIdx + 2}` : "التالي — مراجعة الحجز"}
              />
            </div>
          )}

          {/* Step 2: Review */}
          {step === "review" && filledTravelers.length > 0 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-right mb-2">مراجعة الحجز</h2>

              <div className="p-5 rounded-2xl bg-card border border-border">
                <h3 className="font-bold mb-4 flex items-center gap-2 justify-end">تفاصيل الجولة <Sparkles className="w-4 h-4 text-primary" /></h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "الجولة", value: tourTitle },
                    { label: "المدينة", value: tourCity },
                    { label: "المدة", value: tourDuration },
                    { label: "الفئة", value: tourCategory },
                    { label: "عدد المسافرين", value: `${travelersCount}` },
                  ].map((f) => (
                    <div key={f.label} className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                      <p className="font-semibold text-foreground">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border">
                <h3 className="font-bold mb-4 flex items-center gap-2 justify-end">بيانات المسافرين ({travelersCount}) <Users className="w-4 h-4 text-primary" /></h3>
                <div className="space-y-4">
                  {filledTravelers.map((t, i) => (
                    <div key={i} className={`${i > 0 ? "pt-4 border-t border-border/30" : ""}`}>
                      {travelersCount > 1 && <p className="text-xs font-semibold text-primary mb-2">مسافر {i + 1}</p>}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                          { label: "الاسم الكامل", value: `${t.firstName} ${t.lastName}` },
                          { label: "نوع الوثيقة", value: t.idType === "national_id" ? "هوية وطنية" : "جواز سفر" },
                          { label: "رقم الوثيقة", value: t.idNumber },
                          { label: "تاريخ الميلاد", value: new Date(t.dateOfBirth).toLocaleDateString("ar-SA") },
                          { label: "رقم الجوال", value: t.phone },
                        ].map((f) => (
                          <div key={f.label} className="bg-muted/30 rounded-xl p-3">
                            <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                            <p className="font-semibold text-foreground">{f.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setCurrentTravelerIdx(0); setStep("traveler"); }} className="mt-3 text-xs text-primary hover:underline">تعديل البيانات</button>
              </div>

              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                <h3 className="font-bold mb-3 text-right">ملخص السعر</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold text-primary text-lg">{totalPrice.toLocaleString()} {tourCurrency}</span>
                    <span className="text-muted-foreground">الإجمالي</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{travelersCount} مسافر × {tourPrice.toLocaleString()} {tourCurrency}</span>
                    <span>تفاصيل السعر</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setCurrentTravelerIdx(travelersCount - 1); setStep("traveler"); }} className="flex-1">
                  <ChevronRight className="w-4 h-4 ml-1" /> رجوع
                </Button>
                <Button variant="gold" onClick={handleGoToPayment} disabled={paymentPreparing} className="flex-1 py-3 text-base font-bold">
                  {paymentPreparing ? <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> تجهيز الدفع...</> : "التالي — الدفع"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">لن يتم تأكيد الحجز إلا بعد نجاح الدفع.</p>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === "payment" && paymentSessionId && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-right mb-2">الدفع</h2>
              <div className="p-5 rounded-2xl bg-card border border-border">
                <MoyasarPayment
                  amount={totalPrice}
                  description={`Tour booking - ${tourTitle}`}
                  callbackUrl={`${window.location.origin}/tours/payment-callback?session=${paymentSessionId}`}
                  methods={["creditcard"]}
                />
              </div>
              <Button variant="outline" onClick={() => setStep("review")} className="w-full">
                <ChevronRight className="w-4 h-4 ml-1" /> رجوع للمراجعة
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
