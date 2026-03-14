import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plane,
  Search,
  Clock,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Filter,
  Hotel,
  Car,
  Compass,
  Luggage,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Users,
  ChevronRight,
  CreditCard,
  Check,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTenantStore } from "@/stores/tenantStore";
import { createPaymentSession } from "@/lib/paymentSessionClient";
import CityAutocomplete from "@/components/search/CityAutocomplete";
import DatePickerInput from "@/components/ui/date-picker-input";
import TravelerForm, { type TravelerData } from "@/components/booking/TravelerForm";
import MoyasarPayment from "@/components/payment/MoyasarPayment";
import {
  searchFlights as amadeusSearch,
  priceFlightOffer,
  type AmadeusFlightOffer,
  formatDuration,
  getAirlineName,
} from "@/lib/amadeusClient";
import { getFlightDeeplink } from "@/lib/travelpayoutsClient";

const cityToIata: Record<string, string> = {
  "الرياض": "RUH", "جدة": "JED", "الدمام": "DMM", "المدينة المنورة": "MED",
  "أبها": "AHB", "تبوك": "TUU", "القصيم": "ELQ", "حائل": "HAS",
  "جازان": "GIZ", "نجران": "EAM", "ينبع": "YNB", "الطائف": "TIF",
  "دبي": "DXB", "القاهرة": "CAI", "اسطنبول": "IST", "لندن": "LHR",
  "باريس": "CDG", "كوالالمبور": "KUL", "الباحة": "ABT",
};

function resolveIata(input: string): string {
  if (/^[A-Z]{3}$/.test(input.trim())) return input.trim();
  const mapped = cityToIata[input.trim()];
  if (mapped) return mapped;
  const match = input.match(/\(([A-Z]{3})\)/);
  if (match) return match[1];
  return input.trim().toUpperCase().slice(0, 3);
}

const domesticDestinations = [
  { name: "الرياض", code: "RUH" }, { name: "جدة", code: "JED" }, { name: "الدمام", code: "DMM" },
  { name: "القصيم", code: "ELQ" }, { name: "أبها", code: "AHB" }, { name: "الطائف", code: "TIF" },
  { name: "المدينة المنورة", code: "MED" }, { name: "تبوك", code: "TUU" },
  { name: "ينبع", code: "YNB" }, { name: "حائل", code: "HAS" },
  { name: "الباحة", code: "ABT" }, { name: "نجران", code: "EAM" },
];
const internationalDestinations = [
  { name: "دبي", code: "DXB" }, { name: "القاهرة", code: "CAI" }, { name: "اسطنبول", code: "IST" },
  { name: "لندن", code: "LHR" }, { name: "باريس", code: "CDG" }, { name: "كوالالمبور", code: "KUL" },
  { name: "جاكرتا", code: "CGK" }, { name: "بانكوك", code: "BKK" },
  { name: "عمّان", code: "AMM" }, { name: "بيروت", code: "BEY" },
  { name: "تونس", code: "TUN" }, { name: "الدار البيضاء", code: "CMN" },
];
const middleEastDestinations = [
  { name: "دبي", code: "DXB" }, { name: "أبوظبي", code: "AUH" }, { name: "الدوحة", code: "DOH" },
  { name: "مسقط", code: "MCT" }, { name: "البحرين", code: "BAH" }, { name: "الكويت", code: "KWI" },
  { name: "عمّان", code: "AMM" }, { name: "بيروت", code: "BEY" },
  { name: "القاهرة", code: "CAI" }, { name: "بغداد", code: "BGW" },
];

const airlines = [
  { name: "الخطوط السعودية", code: "SV", logo: "/images/airlines/saudia.png" },
  { name: "طيران ناس", code: "XY", logo: "/images/airlines/flynas.png" },
  { name: "طيران أديل", code: "F3", logo: "/images/airlines/flyadeal.png" },
  { name: "فلاي دبي", code: "FZ", logo: "/images/airlines/flydubai.png" },
  { name: "الخطوط القطرية", code: "QR", logo: "/images/airlines/qatar.png" },
  { name: "العربية للطيران", code: "G9", logo: "/images/airlines/airarabia.png" },
  { name: "الخطوط التركية", code: "TK", logo: "/images/airlines/turkish.png" },
];

const addOnServices = [
  { icon: Hotel, title: "حجز فندق", desc: "احجز الفنادق بأسعار مخفضة مع خيارات حية.", link: "/hotels" },
  { icon: Car, title: "تأجير سيارة", desc: "سيارات حديثة مع أو بدون سائق.", link: "/cars" },
  { icon: Compass, title: "جولات سياحية", desc: "اكتشف أجمل المعالم مع مرشدين محترفين.", link: "/tours" },
  { icon: Luggage, title: "خدمات المغادرة", desc: "مساعدتك في إجراءات السفر والتأشيرات.", link: "/transfers" },
];

type DestTab = "domestic" | "international" | "middleeast";
type BookingStep = "search" | "traveler" | "review" | "payment";
// Multi-traveler: index of the traveler currently being filled


// Build Amadeus traveler object from TravelerData
function buildAmadeusTraveler(data: TravelerData, id: string) {
  return {
    id,
    dateOfBirth: data.dateOfBirth,
    name: { firstName: data.firstName, lastName: data.lastName },
    gender: "MALE",
    contact: {
      emailAddress: data.email || "guest@khattah.com",
      phones: [{ deviceType: "MOBILE", countryCallingCode: "966", number: data.phone.replace(/^\+966/, "").replace(/\s/g, "") }],
    },
    documents: [
      data.idType === "passport"
        ? {
            documentType: "PASSPORT",
            birthPlace: "SA",
            issuanceLocation: "SA",
            issuanceDate: data.dateOfBirth,
            number: data.idNumber,
            expiryDate: data.passportExpiry || "",
            issuanceCountry: "SA",
            validityCountry: "SA",
            nationality: "SA",
            holder: true,
          }
        : {
            documentType: "IDENTITY_CARD",
            number: data.idNumber,
            expiryDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            issuanceCountry: "SA",
            validityCountry: "SA",
            nationality: "SA",
            holder: true,
          },
    ],
  };
}

export default function Flights() {
  const [urlParams] = useSearchParams();
  const [from, setFrom] = useState(urlParams.get("from") || "");
  const [to, setTo] = useState(urlParams.get("to") || "");
  const [departDate, setDepartDate] = useState(urlParams.get("depart") || "");
  const [returnDate, setReturnDate] = useState(urlParams.get("return") || "");
  const [passengers, setPassengers] = useState(Number(urlParams.get("passengers")) || 1);
  const [tripType, setTripType] = useState<"roundtrip" | "oneway">(urlParams.get("tripType") as "roundtrip" | "oneway" || "roundtrip");
  const [searchResults, setSearchResults] = useState<AmadeusFlightOffer[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [destTab, setDestTab] = useState<DestTab>("domestic");
  const [tpFlightLink, setTpFlightLink] = useState("");
  const [travelClass, setTravelClass] = useState("ECONOMY");
  const [airlineFilter, setAirlineFilter] = useState("");

  // Multi-step booking state
  const [step, setStep] = useState<BookingStep>("search");
  const [selectedOffer, setSelectedOffer] = useState<AmadeusFlightOffer | null>(null);
  const [travelers, setTravelers] = useState<(TravelerData | null)[]>([]);
  const [currentTravelerIdx, setCurrentTravelerIdx] = useState(0);
  const [pricedOffer, setPricedOffer] = useState<AmadeusFlightOffer | null>(null);
  const [pricing, setPricing] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [paymentPreparing, setPaymentPreparing] = useState(false);

  const { tenant } = useTenantStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const autoSearchDone = useRef(false);

  // Auto-search when navigating from homepage with params
  useEffect(() => {
    if (autoSearchDone.current) return;
    const fromParam = urlParams.get("from");
    const toParam = urlParams.get("to");
    const departParam = urlParams.get("depart");
    if (fromParam && toParam && departParam) {
      autoSearchDone.current = true;
      const originCode = resolveIata(fromParam);
      const destCode = resolveIata(toParam);
      const retParam = urlParams.get("return") || undefined;
      setSearching(true);
      amadeusSearch({
        origin: originCode,
        destination: destCode,
        departureDate: departParam,
        returnDate: tripType === "roundtrip" && retParam ? retParam : undefined,
        adults: passengers,
        max: 250,
        travelClass: travelClass,
        airline: airlineFilter || undefined,
      })
        .then((result) => {
          let offers = result.data || [];
          if (airlineFilter) {
            offers = offers.filter((o: AmadeusFlightOffer) => 
              o.validatingAirlineCodes?.includes(airlineFilter) ||
              o.itineraries?.[0]?.segments?.[0]?.carrierCode === airlineFilter
            );
          }
          setSearchResults(offers);
          if (offers.length === 0) setSearchError("لم يتم العثور على رحلات لهذا المسار. جرّب تغيير التاريخ أو الوجهة.");
          // Get Travelpayouts comparison link
          getFlightDeeplink({ origin: originCode, destination: destCode, departDate: departParam, returnDate: retParam, adults: passengers })
            .then(setTpFlightLink).catch(() => {});
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "حدث خطأ";
          setSearchError(message);
        })
        .finally(() => setSearching(false));
    }
  }, [travelClass, airlineFilter]);

  // ── Step 1: Search ──
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    const originCode = resolveIata(from);
    const destCode = resolveIata(to);
    if (!originCode || !destCode || !departDate) {
      toast({ title: "بيانات ناقصة", description: "يرجى تحديد مدينة المغادرة والوصول والتاريخ", variant: "destructive" });
      return;
    }
    setSearching(true);
    setSearchResults(null);
    try {
      const result = await amadeusSearch({
        origin: originCode, destination: destCode, departureDate: departDate,
        returnDate: tripType === "roundtrip" && returnDate ? returnDate : undefined,
        adults: passengers, max: 250, travelClass: travelClass,
        airline: airlineFilter || undefined,
      });
      let offers = result.data || [];
      if (airlineFilter) {
        offers = offers.filter((o: AmadeusFlightOffer) => 
          o.validatingAirlineCodes?.includes(airlineFilter) ||
          o.itineraries?.[0]?.segments?.[0]?.carrierCode === airlineFilter
        );
      }
      setSearchResults(offers);
      if (offers.length === 0) setSearchError("لم يتم العثور على رحلات لهذا المسار. جرّب تغيير التاريخ أو الوجهة.");
      // Get Travelpayouts comparison link
      getFlightDeeplink({
        origin: originCode, destination: destCode, departDate: departDate,
        returnDate: tripType === "roundtrip" && returnDate ? returnDate : undefined,
        adults: passengers,
      }).then(setTpFlightLink).catch(() => {});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ";
      setSearchError(message);
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  // ── Select offer → init travelers array + go to traveler step ──
  const handleSelectOffer = async (offer: AmadeusFlightOffer) => {
    setSelectedOffer(offer);
    setTravelers(Array(passengers).fill(null));
    setCurrentTravelerIdx(0);
    setPricing(true);
    try {
      const priced = await priceFlightOffer(offer);
      setPricedOffer(priced?.data?.flightOffers?.[0] || offer);
    } catch {
      setPricedOffer(offer);
    } finally {
      setPricing(false);
    }
    setStep("traveler");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Step 2: each traveler form submission ──
  const handleTravelerSubmit = (data: TravelerData) => {
    const updated = [...travelers];
    updated[currentTravelerIdx] = data;
    setTravelers(updated);
    if (currentTravelerIdx < passengers - 1) {
      setCurrentTravelerIdx((i) => i + 1);
    } else {
      setStep("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Step 3: Review → go to payment (NO booking happens here) ──
  const handleGoToPayment = async () => {
    const filledTravelers = travelers.filter(Boolean) as TravelerData[];
    if (!pricedOffer || filledTravelers.length < passengers) {
      toast({ title: "بيانات ناقصة", description: "يرجى إدخال بيانات جميع المسافرين", variant: "destructive" });
      return;
    }

    // Create payment session once (guest-friendly)
    if (!paymentSessionId) {
      setPaymentPreparing(true);
      try {
        const amadeusTravelers = filledTravelers.map((t, i) => buildAmadeusTraveler(t, String(i + 1)));
        const totalPrice = parseFloat(pricedOffer.price.grandTotal) * passengers;

        const created = await createPaymentSession({
          flow: "flight",
          amount: totalPrice,
          currency: pricedOffer.price.currency || "SAR",
          payment_provider: "moyasar",
          tenant_id: tenant?.id || null,
          travelers_count: passengers,
          details_json: {
            pricedOffer,
            passengers,
            travelers: filledTravelers,
            amadeusTravelers,
          },
        });
        setPaymentSessionId(created.id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "تعذر تجهيز الدفع";
        toast({ title: "خطأ", description: message, variant: "destructive" });
        return;
      } finally {
        setPaymentPreparing(false);
      }
    }

    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFlow = () => {
    setStep("search");
    setSelectedOffer(null);
    setPricedOffer(null);
    setTravelers([]);
    setCurrentTravelerIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const destList = destTab === "domestic" ? domesticDestinations : destTab === "international" ? internationalDestinations : middleEastDestinations;
  const displayOffer = pricedOffer || selectedOffer;

  return (
    <>
      <div className="min-h-screen">

        {/* ════════════════ BOOKING STEPPER ════════════════ */}
        {step !== "search" && (
          <div className="bg-card border-b border-border sticky top-0 z-30">
            <div className="container mx-auto px-4 lg:px-8 py-3">
              <div className="flex items-center justify-center gap-2 text-sm">
                {[
                  { id: "search", label: "اختيار الرحلة", icon: Plane },
                  { id: "traveler", label: "بيانات المسافر", icon: Users },
                  { id: "review", label: "مراجعة", icon: CheckCircle2 },
                  { id: "payment", label: "الدفع", icon: CreditCard },
                ].map((s, idx, arr) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        step === s.id
                          ? "bg-primary text-primary-foreground"
                          : ((step === "traveler" && s.id === "search") ||
                              (step === "review" && (s.id === "search" || s.id === "traveler")) ||
                              (step === "payment" && s.id !== "payment"))
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {((step === "traveler" && s.id === "search") ||
                        (step === "review" && s.id !== "review") ||
                        (step === "payment" && s.id !== "payment")) ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <s.icon className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                    {idx < arr.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ STEP 1: SEARCH ════════════════ */}
        {step === "search" && (
          <>
            {/* Hero + Search */}
            <section className="bg-gradient-to-br from-primary via-primary to-orange-600 pt-8 pb-20">
              <div className="container mx-auto px-4 lg:px-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">احجز رحلتك القادمة</h1>
                  <p className="text-white/80 text-sm">أفضل أسعار تذاكر الطيران مع خدمات إضافية مميزة</p>
                </div>

                {/* Search Card */}
                <form onSubmit={handleSearch} className="max-w-5xl mx-auto bg-card rounded-2xl shadow-xl p-6 lg:p-8 -mt-10 relative z-10">
                  <div className="flex gap-2 justify-end mb-6">
                    <button type="button" onClick={() => setTripType("oneway")}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${tripType === "oneway" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Plane className="w-4 h-4" /> ذهاب فقط
                    </button>
                    <button type="button" onClick={() => setTripType("roundtrip")}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${tripType === "roundtrip" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <RefreshCw className="w-4 h-4" /> ذهاب وعودة
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1.5 text-right">مدينة المغادرة</label>
                      <CityAutocomplete value={from} onChange={setFrom} placeholder="اختر المدينة أو المطار" label="" showCode />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1.5 text-right">مدينة الوصول</label>
                      <CityAutocomplete value={to} onChange={setTo} placeholder="اختر المدينة أو المطار" label="" showCode />
                    </div>
                  </div>
                  <div className={`grid ${tripType === "roundtrip" ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4 mb-4`}>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1.5 text-right">تاريخ المغادرة</label>
                      <DatePickerInput
                        value={departDate}
                        onChange={setDepartDate}
                        placeholder="اختر تاريخ المغادرة"
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="bg-muted/50 border-border"
                      />
                    </div>
                    {tripType === "roundtrip" && (
                      <div>
                        <label className="text-sm text-muted-foreground block mb-1.5 text-right">تاريخ العودة</label>
                        <DatePickerInput
                          value={returnDate}
                          onChange={setReturnDate}
                          placeholder="اختر تاريخ العودة"
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || (departDate ? date < new Date(departDate) : false)}
                          className="bg-muted/50 border-border"
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1.5 text-right">عدد المسافرين</label>
                      <div className="bg-muted/50 border border-border rounded-xl px-4 py-2.5 flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                        <select value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}
                          className="bg-transparent w-full text-sm text-foreground outline-none text-right">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>مسافر {n}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1.5 text-right">درجة السفر</label>
                      <div className="bg-muted/50 border border-border rounded-xl px-4 py-2.5 flex items-center gap-2">
                        <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                        <select 
                          title="درجة السفر" 
                          className="bg-transparent w-full text-sm text-foreground outline-none text-right"
                          value={travelClass}
                          onChange={(e) => setTravelClass(e.target.value)}
                        >
                          <option value="ECONOMY">الاقتصادية</option>
                          <option value="BUSINESS">رجال الأعمال</option>
                          <option value="FIRST">الأولى</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1.5 text-right">شركة الطيران (اختياري)</label>
                      <div className="bg-muted/50 border border-border rounded-xl px-4 py-2.5 flex items-center gap-2">
                        <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                        <select 
                          title="شركة الطيران" 
                          className="bg-transparent w-full text-sm text-foreground outline-none text-right"
                          value={airlineFilter}
                          onChange={(e) => setAirlineFilter(e.target.value)}
                        >
                          <option value="">كل الشركات</option>
                          {airlines.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button type="button" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                      <Filter className="w-4 h-4" /> تصفية متقدمة
                    </button>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8 py-3 font-bold text-base" type="submit" disabled={searching}>
                      {searching ? <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> جاري البحث...</> : <><Plane className="w-5 h-5 ml-2" /> ابحث عن رحلة</>}
                    </Button>
                  </div>
                </form>
              </div>
            </section>

            {/* Search Error */}
            {searchError && (
              <div className="container mx-auto px-4 lg:px-8 -mt-6 mb-8">
                <div className="max-w-5xl mx-auto p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-center">
                  <p className="text-destructive font-medium flex items-center justify-center gap-2"><AlertCircle className="w-5 h-5" />{searchError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setSearchError("")}>
                    <RefreshCw className="w-4 h-4 ml-2" /> حاول مرة أخرى
                  </Button>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
              <section className="section-padding bg-muted/20">
                <div className="container mx-auto px-4 lg:px-8">
                  <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-right">نتائج البحث ({searchResults.length} رحلة)</h3>
                      {tpFlightLink && (
                        <a href={tpFlightLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                          <ExternalLink className="w-4 h-4" />
                          قارن الأسعار
                        </a>
                      )}
                    </div>
                    <div className="space-y-4">
                      {searchResults.map((offer) => {
                        const outbound = offer.itineraries[0];
                        const firstSeg = outbound.segments[0];
                        const lastSeg = outbound.segments[outbound.segments.length - 1];
                        const stops = outbound.segments.length - 1;
                        const airline = offer.validatingAirlineCodes?.[0] || firstSeg.carrierCode;
                        return (
                          <div key={offer.id} className="flex flex-col lg:flex-row items-stretch rounded-2xl bg-card border border-border hover:border-primary/40 transition-all overflow-hidden">
                            <div className="flex-1 p-5 lg:p-6">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                  <Plane className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{getAirlineName(airline)}</p>
                                  <p className="text-xs text-muted-foreground">{airline}{firstSeg.number}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mb-2">
                                <div className="text-center">
                                  <p className="text-xl font-bold">{new Date(firstSeg.departure.at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</p>
                                  <p className="text-xs text-muted-foreground font-medium">{firstSeg.departure.iataCode}</p>
                                </div>
                                <div className="flex-1 flex flex-col items-center gap-1">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(outbound.duration)}</p>
                                  <div className="w-full h-px bg-border relative"><div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rounded-full bg-primary" /></div>
                                  <p className="text-xs text-muted-foreground">{stops === 0 ? "مباشر" : `${stops} توقف`}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xl font-bold">{new Date(lastSeg.arrival.at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</p>
                                  <p className="text-xs text-muted-foreground font-medium">{lastSeg.arrival.iataCode}</p>
                                </div>
                              </div>
                              {offer.itineraries[1] && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <p className="text-xs text-muted-foreground mb-1">العودة</p>
                                  <div className="flex items-center gap-3 text-sm">
                                    <span className="font-medium">{offer.itineraries[1].segments[0].departure.iataCode}</span>
                                    <ArrowLeft className="w-3 h-3 text-muted-foreground" />
                                    <span className="font-medium">{offer.itineraries[1].segments[offer.itineraries[1].segments.length - 1].arrival.iataCode}</span>
                                    <span className="text-muted-foreground text-xs">• {formatDuration(offer.itineraries[1].duration)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="lg:border-r border-t lg:border-t-0 border-border p-5 lg:p-6 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-3 lg:min-w-[180px] bg-muted/30">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{parseFloat(offer.price.grandTotal).toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{offer.price.currency} / للشخص</p>
                              </div>
                              <Button
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                                onClick={() => handleSelectOffer(offer)}
                                disabled={pricing}
                              >
                                {pricing ? <Loader2 className="w-4 h-4 animate-spin" /> : "اختر وتابع →"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Featured Flights from DB */}
            <FeaturedFlightsSection />

            {/* Popular Destinations */}
            <section className="section-padding bg-background">
              <div className="container mx-auto px-4 lg:px-8">
                <div className="max-w-5xl mx-auto">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { id: "middleeast" as DestTab, label: "الشرق الأوسط" },
                        { id: "international" as DestTab, label: "وجهات دولية" },
                        { id: "domestic" as DestTab, label: "وجهات داخلية" },
                      ].map(t => (
                        <button key={t.id} onClick={() => setDestTab(t.id)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${destTab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground">أشهر الوجهات</h2>
                      <p className="text-sm text-muted-foreground">اختر وجهتك بسرعة من أكثر الوجهات طلباً.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-2">
                    {destList.map(d => (
                      <button key={d.code} onClick={() => setTo(d.name)}
                        className="flex items-center gap-2 justify-end py-2 text-sm text-foreground hover:text-primary transition-colors group">
                        <span className="group-hover:font-medium">{d.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 group-hover:bg-primary shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Airlines */}
            <section className="section-padding-sm bg-muted/20 border-t border-border">
              <div className="container mx-auto px-4 lg:px-8">
                <div className="max-w-5xl mx-auto">
                  <h2 className="text-2xl font-bold text-foreground text-right mb-6">أشهر شركات الطيران</h2>
                  <div className="flex flex-wrap gap-3 justify-end">
                    {airlines.map(a => (
                      <div key={a.code} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 transition-colors cursor-pointer">
                        <span className="text-sm font-medium text-foreground">{a.name}</span>
                        <img src={a.logo} alt={a.name} className="w-8 h-8 object-contain" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Add-ons */}
            <section className="section-padding bg-muted/10">
              <div className="container mx-auto px-4 lg:px-8">
                <div className="max-w-5xl mx-auto">
                  <div className="text-center mb-10">
                    <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-2">خدمات إضافية برحلتك</h2>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {addOnServices.map((s, i) => (
                      <div key={i} className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/40 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <s.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-bold text-foreground mb-1">{s.title}</h3>
                        <p className="text-xs text-muted-foreground mb-4">{s.desc}</p>
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm" onClick={() => navigate(s.link)}>
                          أضف الخدمة
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ════════════════ STEP 2: TRAVELER FORMS (one per passenger) ════════════════ */}
        {step === "traveler" && displayOffer && (
          <section className="section-padding bg-background">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="max-w-2xl mx-auto">
                {/* Flight Summary Card */}
                <div className="mb-5 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {parseFloat(displayOffer.price.grandTotal).toLocaleString()} <span className="text-sm">{displayOffer.price.currency}</span>
                      </p>
                      {selectedOffer && pricedOffer && parseFloat(pricedOffer.price.grandTotal) !== parseFloat(selectedOffer.price.grandTotal) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="line-through">{parseFloat(selectedOffer.price.grandTotal).toLocaleString()}</span>
                          {" "}تم تحديث السعر بعد التحقق
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {displayOffer.itineraries[0].segments[0].departure.iataCode}
                        <ArrowLeft className="w-4 h-4 inline mx-2 text-muted-foreground" />
                        {(() => { const segs = displayOffer.itineraries[0].segments; return segs[segs.length - 1].arrival.iataCode; })()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(displayOffer.itineraries[0].segments[0].departure.at).toLocaleDateString("ar", { weekday: "long", day: "numeric", month: "long" })}
                        {" • "}
                        {passengers} مسافر
                        {" • "}
                        {getAirlineName(displayOffer.validatingAirlineCodes?.[0] || displayOffer.itineraries[0].segments[0].carrierCode)}
                      </p>
                    </div>
                  </div>

                  {/* Multi-passenger progress indicator */}
                  {passengers > 1 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                          مسافر {currentTravelerIdx + 1} من {passengers}
                        </span>
                        <div className="flex gap-1.5">
                          {Array.from({ length: passengers }).map((_, i) => (
                            <div key={i} className={`w-6 h-1.5 rounded-full transition-all ${i < currentTravelerIdx ? "bg-primary" : i === currentTravelerIdx ? "bg-primary/60" : "bg-muted"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <TravelerForm
                  key={currentTravelerIdx}
                  onSubmit={handleTravelerSubmit}
                  onBack={currentTravelerIdx === 0 ? resetFlow : () => setCurrentTravelerIdx(i => i - 1)}
                  title={passengers > 1 ? `بيانات المسافر ${currentTravelerIdx + 1}` : "بيانات المسافر الرئيسي"}
                  submitLabel={
                    passengers > 1 && currentTravelerIdx < passengers - 1
                      ? `التالي — مسافر ${currentTravelerIdx + 2}`
                      : "التالي — مراجعة الحجز"
                  }
                />
              </div>
            </div>
          </section>
        )}


        {/* ════════════════ STEP 3: REVIEW ════════════════ */}
        {step === "review" && displayOffer && travelers.some(Boolean) && (
          <section className="section-padding bg-background">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="max-w-2xl mx-auto space-y-5">
                <h2 className="text-2xl font-bold text-right mb-2">مراجعة الحجز</h2>

                {/* Flight Summary */}
                <div className="p-5 rounded-2xl bg-card border border-border">
                  <h3 className="font-bold mb-4 flex items-center gap-2 justify-end">
                    تفاصيل الرحلة <Plane className="w-4 h-4 text-primary" />
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: "من", value: displayOffer.itineraries[0].segments[0].departure.iataCode },
                      {
                        label: "إلى",
                        value: (() => {
                          const s = displayOffer.itineraries[0].segments;
                          return s[s.length - 1].arrival.iataCode;
                        })(),
                      },
                      { label: "تاريخ المغادرة", value: new Date(displayOffer.itineraries[0].segments[0].departure.at).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" }) },
                      { label: "شركة الطيران", value: getAirlineName(displayOffer.validatingAirlineCodes?.[0] || displayOffer.itineraries[0].segments[0].carrierCode) },
                      { label: "عدد المسافرين", value: `${passengers} مسافر` },
                      { label: "المدة", value: formatDuration(displayOffer.itineraries[0].duration) },
                    ].map((f) => (
                      <div key={f.label} className="bg-muted/30 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                        <p className="font-semibold text-foreground">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Travelers Summary */}
                <div className="p-5 rounded-2xl bg-card border border-border">
                  <h3 className="font-bold mb-4 flex items-center gap-2 justify-end">
                    بيانات المسافرين ({passengers}) <Users className="w-4 h-4 text-primary" />
                  </h3>
                  <div className="space-y-4">
                    {(travelers.filter(Boolean) as TravelerData[]).map((t, i) => (
                      <div key={i} className={`${i > 0 ? "pt-4 border-t border-border" : ""}`}>
                        {passengers > 1 && <p className="text-xs font-semibold text-primary mb-2">مسافر {i + 1}</p>}
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
                    onClick={() => {
                      setCurrentTravelerIdx(0);
                      setStep("traveler");
                    }}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    تعديل البيانات
                  </button>
                </div>

                {/* Pricing */}
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                  <h3 className="font-bold mb-3 text-right">ملخص السعر</h3>
                  {selectedOffer && pricedOffer && parseFloat(pricedOffer.price.grandTotal) !== parseFloat(selectedOffer.price.grandTotal) && (
                    <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 text-right">
                      تم تحديث السعر من {parseFloat(selectedOffer.price.grandTotal).toLocaleString()} إلى {parseFloat(pricedOffer.price.grandTotal).toLocaleString()} {pricedOffer.price.currency} بعد التحقق من شركة الطيران
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-bold text-primary text-lg">
                        {(parseFloat(displayOffer.price.grandTotal) * passengers).toLocaleString()} {displayOffer.price.currency}
                      </span>
                      <span className="text-muted-foreground">الإجمالي</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{parseFloat(displayOffer.price.grandTotal).toLocaleString()} × {passengers} مسافر</span>
                      <span>سعر التذكرة × العدد</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentTravelerIdx(passengers - 1);
                      setStep("traveler");
                    }}
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
                      <>
                        <Loader2 className="w-5 h-5 ml-2 animate-spin" /> تجهيز الدفع...
                      </>
                    ) : (
                      "التالي — الدفع"
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">لن يتم تأكيد الحجز إلا بعد نجاح الدفع.</p>
              </div>
            </div>
          </section>
        )}

        {/* ════════════════ STEP 4: PAYMENT ════════════════ */}
        {step === "payment" && displayOffer && paymentSessionId && (
          <section className="section-padding bg-background">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="max-w-2xl mx-auto space-y-5">
                <h2 className="text-2xl font-bold text-right mb-2">الدفع</h2>

                <div className="p-5 rounded-2xl bg-card border border-border">
                  <MoyasarPayment
                    amount={parseFloat(displayOffer.price.grandTotal) * passengers}
                    description={`Flight booking ${displayOffer.id}`}
                    callbackUrl={`${window.location.origin}/flights/payment-callback?session=${paymentSessionId}`}
                    methods={["creditcard", "applepay", "samsungpay"]}
                  />
                </div>

                <Button variant="outline" onClick={() => setStep("review")} className="w-full">
                  <ChevronRight className="w-4 h-4 ml-1" /> رجوع للمراجعة
                </Button>
              </div>
            </div>
          </section>
        )}

      </div>
    </>
  );
}

function FeaturedFlightsSection() {
  const [flights, setFlights] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    supabase.from("flights").select("*").eq("is_active", true).order("sort_order").limit(6)
      .then(({ data }) => setFlights(data || []));
  }, []);

  if (flights.length === 0) return null;

  return (
    <section className="section-padding bg-muted/10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-right mb-6">رحلات مميزة</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flights.map((f) => (
              <div key={f.id} className="rounded-2xl bg-card border border-border p-5 hover:border-primary/30 transition-all">
                {f.image_url && <img src={f.image_url} alt={f.airline} className="w-full h-32 object-cover rounded-xl mb-3" loading="lazy" />}
                <h3 className="font-bold text-sm mb-1">{f.airline} {f.flight_number && `- ${f.flight_number}`}</h3>
                <p className="text-sm text-muted-foreground mb-2">{f.origin} → {f.destination}</p>
                {f.cabin_class && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{f.cabin_class}</span>}
                <div className="flex items-end justify-between mt-3 pt-3 border-t border-border">
                  <p className="text-lg font-bold text-primary">{Number(f.price).toLocaleString()} <span className="text-xs font-normal">{f.currency}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
