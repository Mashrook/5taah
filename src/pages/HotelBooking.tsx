import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hotel, MapPin, CreditCard, Loader2, ChevronLeft, ChevronRight,
  Calendar, Moon, ShieldCheck, AlertCircle, CheckCircle2, Users, Plane, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useHotelCartStore } from "@/stores/hotelCartStore";
import { useAuthStore } from "@/stores/authStore";
import { useTenantStore } from "@/stores/tenantStore";
import { supabase } from "@/integrations/supabase/client";
import {
  getCityName,
  getNightsCount,
  formatDate,
} from "@/lib/amadeusClient";
import TravelerForm, { type TravelerData } from "@/components/booking/TravelerForm";
import MoyasarPayment from "@/components/payment/MoyasarPayment";

type BookingStep = "traveler" | "review" | "payment";

export default function HotelBooking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const { tenant } = useTenantStore();
  const {
    selectedOffer,
    selectedOfferId,
    searchParams,
    setBookingConfirmation,
    clearBookingFlow,
  } = useHotelCartStore();

  const [step, setStep] = useState<BookingStep>("traveler");
  const adultsCount = searchParams?.adults || 1;
  const [travelers, setTravelers] = useState<(TravelerData | null)[]>(Array(adultsCount).fill(null));
  const [currentTravelerIdx, setCurrentTravelerIdx] = useState(0);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [paymentPreparing, setPaymentPreparing] = useState(false);

  if (!selectedOffer || !selectedOfferId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-xl font-bold mb-2">لم يتم اختيار عرض</p>
          <p className="text-muted-foreground mb-6">يرجى اختيار فندق من نتائج البحث أولاً</p>
          <Button variant="gold" onClick={() => navigate("/hotels")}>البحث عن فنادق</Button>
        </div>
      </div>
    );
  }

  const offer = selectedOffer.offers.find(o => o.id === selectedOfferId) || selectedOffer.offers[0];
  const nights = getNightsCount(offer.checkInDate, offer.checkOutDate);
  const totalPrice = parseFloat(offer.price.total);
  const currency = offer.price.currency;
  const roomDesc = offer.room?.description?.text || offer.room?.typeEstimated?.category || "غرفة قياسية";
  const cancellable = offer.policies?.cancellations?.[0];

  // ── Step 1: each traveler form submission ──
  const handleTravelerSubmit = (data: TravelerData) => {
    const updated = [...travelers];
    updated[currentTravelerIdx] = data;
    setTravelers(updated);
    if (currentTravelerIdx < adultsCount - 1) {
      setCurrentTravelerIdx((i) => i + 1);
    } else {
      setStep("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Step 2: Review → go to payment ──
  const handleGoToPayment = async () => {
    const filledTravelers = travelers.filter(Boolean) as TravelerData[];
    if (filledTravelers.length < adultsCount) {
      toast({ title: "بيانات ناقصة", description: "يرجى إدخال بيانات جميع المسافرين", variant: "destructive" });
      return;
    }

    if (!paymentSessionId) {
      setPaymentPreparing(true);
      try {
        const { data, error } = await supabase
          .from("payment_sessions")
          .insert({
            flow: "hotel",
            amount: totalPrice,
            currency: currency || "SAR",
            status: "initiated",
            payment_provider: "moyasar",
            user_id: isAuthenticated && user ? user.id : null,
            tenant_id: tenant?.id || null,
            details_json: {
              hotel_id: selectedOffer.hotel.hotelId,
              hotel_name: selectedOffer.hotel.name,
              city_code: selectedOffer.hotel.cityCode,
              offer_id: selectedOfferId,
              check_in: offer.checkInDate,
              check_out: offer.checkOutDate,
              nights,
              room_description: roomDesc,
              adults_count: adultsCount,
              travelers: filledTravelers,
              price: offer.price,
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

  const resetFlow = () => {
    setStep("traveler");
    setTravelers(Array(adultsCount).fill(null));
    setCurrentTravelerIdx(0);
    navigate("/hotels");
  };

  const filledTravelers = travelers.filter(Boolean) as TravelerData[];

  // Stepper indicators
  const stepperSteps = [
    { id: "traveler" as const, label: "بيانات المسافر", icon: Users },
    { id: "review" as const, label: "مراجعة", icon: CheckCircle2 },
    { id: "payment" as const, label: "الدفع", icon: CreditCard },
  ];
  const stepOrder: BookingStep[] = ["traveler", "review", "payment"];
  const currentIdx = stepOrder.indexOf(step);

  return (
    <div className="min-h-screen section-padding">
      <div className="container mx-auto px-4 lg:px-8">

        {/* Stepper */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-2 text-sm">
            {stepperSteps.map((s, idx, arr) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    step === s.id
                      ? "bg-primary text-primary-foreground"
                      : idx < currentIdx
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {idx < currentIdx ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <s.icon className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div className={`w-8 h-0.5 rounded-full ${idx < currentIdx ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Hotel Summary Card */}
          <div className="rounded-2xl bg-card/70 border border-border/30 p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Hotel className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">{selectedOffer.hotel.name}</h2>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{getCityName(selectedOffer.hotel.cityCode || "")}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(offer.checkInDate)}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(offer.checkOutDate)}</span>
                  <span className="flex items-center gap-1"><Moon className="w-3.5 h-3.5" /> {nights} {nights > 1 ? "ليالي" : "ليلة"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{roomDesc}</p>
              </div>
              <div className="text-left shrink-0">
                <p className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{currency}</p>
              </div>
            </div>
            {cancellable && (
              <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2 text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>إلغاء مجاني {cancellable.deadline ? `حتى ${formatDate(cancellable.deadline)}` : ""}</span>
              </div>
            )}
          </div>

          {/* ════════ STEP 1: TRAVELER FORM ════════ */}
          {step === "traveler" && (
            <div className="space-y-4">
              {adultsCount > 1 && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                      مسافر {currentTravelerIdx + 1} من {adultsCount}
                    </span>
                    <div className="flex gap-1.5">
                      {Array.from({ length: adultsCount }).map((_, i) => (
                        <div key={i} className={`w-6 h-1.5 rounded-full transition-all ${i < currentTravelerIdx ? "bg-primary" : i === currentTravelerIdx ? "bg-primary/60" : "bg-muted"}`} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <TravelerForm
                key={currentTravelerIdx}
                onSubmit={handleTravelerSubmit}
                onBack={currentTravelerIdx === 0 ? resetFlow : () => setCurrentTravelerIdx(i => i - 1)}
                title={adultsCount > 1 ? `بيانات المسافر ${currentTravelerIdx + 1}` : "بيانات المسافر"}
                submitLabel={currentTravelerIdx < adultsCount - 1 ? `التالي — مسافر ${currentTravelerIdx + 2}` : "التالي — مراجعة الحجز"}
              />
            </div>
          )}

          {/* ════════ STEP 2: REVIEW ════════ */}
          {step === "review" && filledTravelers.length > 0 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-right mb-2">مراجعة الحجز</h2>

              {/* Hotel details */}
              <div className="p-5 rounded-2xl bg-card border border-border">
                <h3 className="font-bold mb-4 flex items-center gap-2 justify-end">
                  تفاصيل الفندق <Hotel className="w-4 h-4 text-primary" />
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "الفندق", value: selectedOffer.hotel.name },
                    { label: "المدينة", value: getCityName(selectedOffer.hotel.cityCode || "") },
                    { label: "تسجيل الوصول", value: formatDate(offer.checkInDate) },
                    { label: "تسجيل المغادرة", value: formatDate(offer.checkOutDate) },
                    { label: "عدد الليالي", value: `${nights} ${nights > 1 ? "ليالي" : "ليلة"}` },
                    { label: "الغرفة", value: roomDesc },
                  ].map((f) => (
                    <div key={f.label} className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                      <p className="font-semibold text-foreground">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Travelers summary */}
              <div className="p-5 rounded-2xl bg-card border border-border">
                <h3 className="font-bold mb-4 flex items-center gap-2 justify-end">
                  بيانات المسافرين ({adultsCount}) <Users className="w-4 h-4 text-primary" />
                </h3>
                <div className="space-y-4">
                  {filledTravelers.map((t, i) => (
                    <div key={i} className={`${i > 0 ? "pt-4 border-t border-border/30" : ""}`}>
                      {adultsCount > 1 && <p className="text-xs font-semibold text-primary mb-2">مسافر {i + 1}</p>}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                          { label: "الاسم الكامل", value: `${t.firstName} ${t.lastName}` },
                          { label: "نوع الوثيقة", value: t.idType === "national_id" ? "هوية وطنية" : "جواز سفر" },
                          { label: "رقم الوثيقة", value: t.idNumber },
                          { label: "تاريخ الميلاد", value: new Date(t.dateOfBirth).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" }) },
                          { label: "رقم الجوال", value: t.phone },
                          ...(t.idType === "passport" && t.passportExpiry
                            ? [{ label: "انتهاء الجواز", value: new Date(t.passportExpiry).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" }) }]
                            : []),
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
                <button
                  onClick={() => { setCurrentTravelerIdx(0); setStep("traveler"); }}
                  className="mt-3 text-xs text-primary hover:underline"
                >
                  تعديل البيانات
                </button>
              </div>

              {/* Pricing */}
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                <h3 className="font-bold mb-3 text-right">ملخص السعر</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold text-primary text-lg">
                      {totalPrice.toLocaleString()} {currency}
                    </span>
                    <span className="text-muted-foreground">الإجمالي</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{nights} ليالي × {(totalPrice / nights).toLocaleString()} {currency}/ليلة</span>
                    <span>تفاصيل السعر</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setCurrentTravelerIdx(adultsCount - 1); setStep("traveler"); }}
                  className="flex-1"
                >
                  <ChevronRight className="w-4 h-4 ml-1" /> رجوع
                </Button>
                <Button
                  variant="gold"
                  onClick={handleGoToPayment}
                  disabled={paymentPreparing}
                  className="flex-1 py-3 text-base font-bold"
                >
                  {paymentPreparing ? (
                    <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> تجهيز الدفع...</>
                  ) : (
                    "التالي — الدفع"
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">لن يتم تأكيد الحجز إلا بعد نجاح الدفع.</p>
            </div>
          )}

          {/* ════════ STEP 3: PAYMENT (Moyasar) ════════ */}
          {step === "payment" && paymentSessionId && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-right mb-2">الدفع</h2>

              <div className="p-5 rounded-2xl bg-card border border-border">
                <MoyasarPayment
                  amount={totalPrice}
                  description={`Hotel booking - ${selectedOffer.hotel.name}`}
                  callbackUrl={`${window.location.origin}/hotels/payment-callback?session=${paymentSessionId}`}
                  methods={["creditcard", "applepay", "samsungpay"]}
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
