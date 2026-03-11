import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Car, MapPin, CreditCard, Loader2, ChevronRight,
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

export default function CarBooking() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const { tenant } = useTenantStore();

  // Read car info from query params (set when user clicks "احجز الآن")
  const carName = params.get("name") || "";
  const carCategory = params.get("category") || "";
  const carCity = params.get("city") || "";
  const carPrice = parseFloat(params.get("price") || "0");
  const carCurrency = params.get("currency") || "SAR";
  const carId = params.get("id") || "";
  const pickupDate = params.get("pickup") || "";
  const returnDate = params.get("return") || "";

  const days = pickupDate && returnDate
    ? Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const totalPrice = carPrice * days;

  const [step, setStep] = useState<BookingStep>("traveler");
  const [traveler, setTraveler] = useState<TravelerData | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [paymentPreparing, setPaymentPreparing] = useState(false);

  if (!carName || !carPrice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-xl font-bold mb-2">لم يتم اختيار سيارة</p>
          <p className="text-muted-foreground mb-6">يرجى اختيار سيارة من صفحة تأجير السيارات أولاً</p>
          <Button variant="gold" onClick={() => navigate("/cars")}>تأجير السيارات</Button>
        </div>
      </div>
    );
  }

  const handleTravelerSubmit = (data: TravelerData) => {
    setTraveler(data);
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoToPayment = async () => {
    if (!traveler) return;

    if (!paymentSessionId) {
      setPaymentPreparing(true);
      try {
        const { data, error } = await supabase
          .from("payment_sessions")
          .insert({
            flow: "car",
            amount: totalPrice,
            currency: carCurrency,
            status: "initiated",
            payment_provider: "moyasar",
            user_id: isAuthenticated && user ? user.id : null,
            tenant_id: tenant?.id || null,
            details_json: {
              car_id: carId,
              car_name: carName,
              car_category: carCategory,
              city: carCity,
              pickup_date: pickupDate,
              return_date: returnDate,
              days,
              price_per_day: carPrice,
              traveler,
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
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  step === s.id ? "bg-primary text-primary-foreground" : idx < currentIdx ? "bg-primary/20 text-primary" : "text-muted-foreground"
                }`}>
                  {idx < currentIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {idx < arr.length - 1 && <div className={`w-8 h-0.5 rounded-full ${idx < currentIdx ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Car Summary */}
          <div className="rounded-2xl bg-card/70 border border-border/30 p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Car className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">{carName}</h2>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                  {carCity && <><MapPin className="w-4 h-4" /><span>{carCity}</span></>}
                  {carCategory && <span className="bg-muted/30 px-2 py-0.5 rounded-full text-xs">{carCategory}</span>}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {pickupDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {pickupDate}</span>}
                  {returnDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {returnDate}</span>}
                  <span>{days} {days > 1 ? "أيام" : "يوم"}</span>
                </div>
              </div>
              <div className="text-left shrink-0">
                <p className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{carCurrency}</p>
              </div>
            </div>
          </div>

          {/* Step 1: Traveler */}
          {step === "traveler" && (
            <TravelerForm
              onSubmit={handleTravelerSubmit}
              onBack={() => navigate("/cars")}
              title="بيانات المستأجر"
              submitLabel="التالي — مراجعة الحجز"
            />
          )}

          {/* Step 2: Review */}
          {step === "review" && traveler && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-right mb-2">مراجعة الحجز</h2>

              <div className="p-5 rounded-2xl bg-card border border-border">
                <h3 className="font-bold mb-4 flex items-center gap-2 justify-end">تفاصيل السيارة <Car className="w-4 h-4 text-primary" /></h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "السيارة", value: carName },
                    { label: "الفئة", value: carCategory },
                    { label: "المدينة", value: carCity },
                    { label: "تاريخ الاستلام", value: pickupDate },
                    { label: "تاريخ الإرجاع", value: returnDate },
                    { label: "عدد الأيام", value: `${days} ${days > 1 ? "أيام" : "يوم"}` },
                  ].map((f) => (
                    <div key={f.label} className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                      <p className="font-semibold text-foreground">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border">
                <h3 className="font-bold mb-4 flex items-center gap-2 justify-end">بيانات المستأجر <Users className="w-4 h-4 text-primary" /></h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "الاسم الكامل", value: `${traveler.firstName} ${traveler.lastName}` },
                    { label: "نوع الوثيقة", value: traveler.idType === "national_id" ? "هوية وطنية" : "جواز سفر" },
                    { label: "رقم الوثيقة", value: traveler.idNumber },
                    { label: "تاريخ الميلاد", value: new Date(traveler.dateOfBirth).toLocaleDateString("ar-SA") },
                    { label: "رقم الجوال", value: traveler.phone },
                  ].map((f) => (
                    <div key={f.label} className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                      <p className="font-semibold text-foreground">{f.value}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep("traveler")} className="mt-3 text-xs text-primary hover:underline">تعديل البيانات</button>
              </div>

              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                <h3 className="font-bold mb-3 text-right">ملخص السعر</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold text-primary text-lg">{totalPrice.toLocaleString()} {carCurrency}</span>
                    <span className="text-muted-foreground">الإجمالي</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{days} أيام × {carPrice.toLocaleString()} {carCurrency}/يوم</span>
                    <span>تفاصيل السعر</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("traveler")} className="flex-1">
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
                  description={`Car rental - ${carName}`}
                  callbackUrl={`${window.location.origin}/cars/payment-callback?session=${paymentSessionId}`}
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
