import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hotel, MapPin, CreditCard, User, Phone, Mail, Loader2, ChevronLeft,
  Calendar, Moon, ShieldCheck, AlertCircle, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useHotelCartStore } from "@/stores/hotelCartStore";
import { useAuthStore } from "@/stores/authStore";
import { useTenantStore } from "@/stores/tenantStore";
import { supabase } from "@/integrations/supabase/client";
import {
  bookHotelOffer,
  getCityName,
  getNightsCount,
  formatDate,
  type HotelBookingGuest,
} from "@/lib/amadeusClient";
import BookingStepper from "@/components/ui/BookingStepper";
import { z } from "zod";

const bookingSteps = [
  { label: "اختيار الفندق" },
  { label: "بيانات الحاجز" },
  { label: "بيانات المسافر" },
  { label: "الدفع" },
  { label: "التأكيد" },
];

const personSchema = z.object({
  title: z.string().min(1, "اختر اللقب"),
  firstName: z.string().trim().min(2, "الاسم الأول مطلوب").max(50),
  lastName: z.string().trim().min(2, "اسم العائلة مطلوب").max(50),
  email: z.string().trim().email("بريد إلكتروني غير صالح"),
  phone: z.string().trim().min(8, "رقم الهاتف مطلوب").max(20),
});

export default function HotelBooking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const { tenant } = useTenantStore();
  const { selectedOffer, selectedOfferId, searchParams, setBookingConfirmation, clearBookingFlow, bookingConfirmation } = useHotelCartStore();

  const [step, setStep] = useState(1); // 1=booker info, 2=traveler info, 3=payment, 4=confirm
  const [loading, setLoading] = useState(false);
  const [sameAsTraveler, setSameAsTraveler] = useState(true);

  // Booker form (الحاجز)
  const [title, setTitle] = useState("MR");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");

  // Traveler form (المسافر)
  const [travelerTitle, setTravelerTitle] = useState("MR");
  const [travelerFirstName, setTravelerFirstName] = useState("");
  const [travelerLastName, setTravelerLastName] = useState("");
  const [travelerEmail, setTravelerEmail] = useState("");
  const [travelerPhone, setTravelerPhone] = useState("");

  // Payment (demo - Amadeus test uses CORPORATE)
  const [paymentMethod, setPaymentMethod] = useState("CORPORATE");

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

  const handleBookerSubmit = () => {
    const result = personSchema.safeParse({ title, firstName, lastName, email, phone });
    if (!result.success) {
      toast({ title: "بيانات ناقصة", description: result.error.errors[0].message, variant: "destructive" });
      return;
    }
    if (sameAsTraveler) {
      setTravelerTitle(title);
      setTravelerFirstName(firstName);
      setTravelerLastName(lastName);
      setTravelerEmail(email);
      setTravelerPhone(phone);
      setStep(3); // skip to payment
    } else {
      setStep(2); // go to traveler info
    }
  };

  const handleTravelerSubmit = () => {
    const result = personSchema.safeParse({ title: travelerTitle, firstName: travelerFirstName, lastName: travelerLastName, email: travelerEmail, phone: travelerPhone });
    if (!result.success) {
      toast({ title: "بيانات ناقصة", description: result.error.errors[0].message, variant: "destructive" });
      return;
    }
    setStep(3);
  };

  const handleBooking = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: "يرجى تسجيل الدخول", description: "سجّل دخولك لإتمام الحجز", variant: "destructive" });
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const guests: HotelBookingGuest[] = [{
        tid: 1,
        title: travelerTitle,
        firstName: travelerFirstName,
        lastName: travelerLastName,
        phone: travelerPhone,
        email: travelerEmail,
      }];

      // Call Amadeus Hotel Booking API
      const bookingResult = await bookHotelOffer({
        offerId: selectedOfferId,
        guests,
        payment: { method: paymentMethod },
      });

      const confirmation = bookingResult.data?.[0];
      const confirmationId = confirmation?.id || "N/A";
      const providerRef = confirmation?.providerConfirmationId ||
        confirmation?.associatedRecords?.[0]?.reference || "";

      // Save to Supabase
      await supabase.from("bookings").insert({
        user_id: user.id,
        booking_type: "hotel",
        total_price: totalPrice,
        currency,
        status: "confirmed",
        payment_status: paymentMethod === "CORPORATE" ? "corporate" : "paid",
        tenant_id: tenant?.id || null,
        details_json: {
          source: "amadeus",
          amadeus_confirmation_id: confirmationId,
          provider_confirmation_id: providerRef,
          hotel_id: selectedOffer.hotel.hotelId,
          hotel_name: selectedOffer.hotel.name,
          city_code: selectedOffer.hotel.cityCode,
          offer_id: selectedOfferId,
          check_in: offer.checkInDate,
          check_out: offer.checkOutDate,
          nights,
          room_description: roomDesc,
          booker: { title, firstName, lastName, email, phone },
          traveler: { title: travelerTitle, firstName: travelerFirstName, lastName: travelerLastName, email: travelerEmail, phone: travelerPhone },
          price: offer.price,
        },
      });

      // Set confirmation
      setBookingConfirmation({
        confirmationId,
        providerConfirmationId: providerRef,
        hotelName: selectedOffer.hotel.name,
        checkIn: offer.checkInDate,
        checkOut: offer.checkOutDate,
        totalPrice: offer.price.total,
        currency,
      });

      setStep(4);
      toast({ title: "تم الحجز بنجاح! 🏨" });
    } catch (err) {
      console.error("Hotel booking error:", err);
      toast({
        title: "خطأ في الحجز",
        description: err.message || "تعذر إتمام الحجز. حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen section-padding">
      <div className="container mx-auto px-4 lg:px-8">
        <BookingStepper steps={bookingSteps} currentStep={step} className="max-w-2xl mx-auto mb-12" />

        <div className="max-w-3xl mx-auto">
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
                  {selectedOffer.hotel.chainCode && <span className="text-xs bg-muted/30 px-2 py-0.5 rounded">({selectedOffer.hotel.chainCode})</span>}
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

          {/* Step 1: Booker Information */}
          {step === 1 && (
            <div className="rounded-2xl bg-card/70 border border-border/30 p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                بيانات الحاجز (من يقوم بالحجز)
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5">اللقب</label>
                    <Select value={title} onValueChange={setTitle}>
                      <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MR">السيد</SelectItem>
                        <SelectItem value="MS">الآنسة</SelectItem>
                        <SelectItem value="MRS">السيدة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5">الاسم الأول</label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Mohammed" className="bg-muted/20" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5">اسم العائلة</label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Al-Rashid" className="bg-muted/20" dir="ltr" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> البريد الإلكتروني
                    </label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="bg-muted/20" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> رقم الهاتف
                    </label>
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966500000000" className="bg-muted/20" dir="ltr" />
                  </div>
                </div>

                {/* Same as traveler toggle */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={sameAsTraveler} onChange={(e) => setSameAsTraveler(e.target.checked)} className="w-4 h-4 text-primary rounded" />
                    <div>
                      <p className="font-medium text-sm">الحاجز هو نفسه المسافر</p>
                      <p className="text-xs text-muted-foreground">إذا كنت تحجز لشخص آخر، قم بإلغاء التحديد لإدخال بيانات المسافر</p>
                    </div>
                  </label>
                </div>

                <Button variant="gold" size="lg" className="w-full mt-4" onClick={handleBookerSubmit}>
                  {sameAsTraveler ? "متابعة للدفع" : "متابعة لبيانات المسافر"} <ChevronLeft className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Traveler Information */}
          {step === 2 && (
            <div className="rounded-2xl bg-card/70 border border-border/30 p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                بيانات المسافر (من سيقيم في الفندق)
              </h3>
              <p className="text-xs text-muted-foreground mb-4 bg-muted/20 p-3 rounded-xl">
                ℹ️ بيانات الحاجز: {title} {firstName} {lastName} — الآن أدخل بيانات الشخص المسافر
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5">اللقب</label>
                    <Select value={travelerTitle} onValueChange={setTravelerTitle}>
                      <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MR">السيد</SelectItem>
                        <SelectItem value="MS">الآنسة</SelectItem>
                        <SelectItem value="MRS">السيدة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5">الاسم الأول</label>
                    <Input value={travelerFirstName} onChange={(e) => setTravelerFirstName(e.target.value)} placeholder="Ahmed" className="bg-muted/20" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5">اسم العائلة</label>
                    <Input value={travelerLastName} onChange={(e) => setTravelerLastName(e.target.value)} placeholder="Al-Saud" className="bg-muted/20" dir="ltr" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> البريد الإلكتروني
                    </label>
                    <Input type="email" value={travelerEmail} onChange={(e) => setTravelerEmail(e.target.value)} placeholder="traveler@example.com" className="bg-muted/20" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> رقم الهاتف
                    </label>
                    <Input type="tel" value={travelerPhone} onChange={(e) => setTravelerPhone(e.target.value)} placeholder="+966500000000" className="bg-muted/20" dir="ltr" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1">العودة</Button>
                  <Button variant="gold" size="lg" className="flex-1" onClick={handleTravelerSubmit}>
                    متابعة للدفع <ChevronLeft className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="rounded-2xl bg-card/70 border border-border/30 p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                طريقة الدفع
              </h3>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" checked={paymentMethod === "CORPORATE"} onChange={() => setPaymentMethod("CORPORATE")} className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium">دفع مؤسسي (Corporate)</p>
                      <p className="text-xs text-muted-foreground">الدفع عبر حساب الشركة - متاح في بيئة الاختبار</p>
                    </div>
                  </label>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-border/30 opacity-50">
                  <label className="flex items-center gap-3 cursor-not-allowed">
                    <input type="radio" disabled className="w-4 h-4" />
                    <div>
                      <p className="font-medium">بطاقة ائتمان</p>
                      <p className="text-xs text-muted-foreground">سيتم تفعيله عند ربط بوابة Moyasar</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 mb-6">
                <h4 className="font-bold mb-3">ملخص الحجز</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الفندق</span>
                    <span>{selectedOffer.hotel.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الغرفة</span>
                    <span>{roomDesc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الحاجز</span>
                    <span dir="ltr">{title} {firstName} {lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المسافر</span>
                    <span dir="ltr">{travelerTitle} {travelerFirstName} {travelerLastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المدة</span>
                    <span>{nights} {nights > 1 ? "ليالي" : "ليلة"}</span>
                  </div>
                  <div className="border-t border-border/30 pt-2 flex justify-between text-lg font-bold">
                    <span>الإجمالي</span>
                    <span className="text-primary">{totalPrice.toLocaleString()} {currency}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="lg" onClick={() => setStep(sameAsTraveler ? 1 : 2)} className="flex-1">
                  العودة
                </Button>
                <Button variant="gold" size="lg" onClick={handleBooking} disabled={loading} className="flex-1">
                  {loading ? (
                    <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> جاري الحجز...</>
                  ) : (
                    <>تأكيد الحجز <CheckCircle2 className="w-5 h-5 mr-2" /></>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">🔒 بيئة اختبار Amadeus - لا يتم خصم مبالغ حقيقية</p>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && bookingConfirmation && (
            <div className="rounded-2xl bg-card/70 border border-border/30 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">تم تأكيد الحجز! 🎉</h2>
              <p className="text-muted-foreground mb-8">تم حجز فندقك بنجاح عبر Amadeus</p>

              <div className="rounded-xl bg-muted/20 border border-border/30 p-6 text-right mb-6 max-w-md mx-auto">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم التأكيد</span>
                    <span className="font-mono font-bold text-primary">{bookingConfirmation.confirmationId}</span>
                  </div>
                  {bookingConfirmation.providerConfirmationId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">مرجع المزود</span>
                      <span className="font-mono">{bookingConfirmation.providerConfirmationId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الفندق</span>
                    <span>{bookingConfirmation.hotelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تسجيل الدخول</span>
                    <span>{formatDate(bookingConfirmation.checkIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تسجيل الخروج</span>
                    <span>{formatDate(bookingConfirmation.checkOut)}</span>
                  </div>
                  <div className="border-t border-border/30 pt-2 flex justify-between font-bold">
                    <span>الإجمالي</span>
                    <span className="text-primary">{parseFloat(bookingConfirmation.totalPrice).toLocaleString()} {bookingConfirmation.currency}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Button variant="gold" size="lg" className="flex-1" onClick={() => {
                  clearBookingFlow();
                  navigate("/dashboard/bookings");
                }}>
                  حجوزاتي
                </Button>
                <Button variant="outline" size="lg" className="flex-1" onClick={() => {
                  clearBookingFlow();
                  navigate("/hotels");
                }}>
                  بحث جديد
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
