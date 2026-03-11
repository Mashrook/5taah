import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plane, Hotel, Users, Search, Headphones, Package, Play, Minus, Plus, Car, Map, ArrowRightLeft } from "lucide-react";
import { useState, useEffect } from "react";
import heroImage from "@/assets/riyadh-hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import CityAutocomplete from "@/components/search/CityAutocomplete";
import HotelAutocomplete from "@/components/search/HotelAutocomplete";
import DatePickerInput from "@/components/ui/date-picker-input";
import { useToast } from "@/hooks/use-toast";

type SearchTab = "flights" | "hotels" | "cars" | "tours" | "transfers";

export default function HeroSection() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [promoUrl, setPromoUrl] = useState("");
  const [promoType, setPromoType] = useState<"video" | "image">("video");
  const [searchTab, setSearchTab] = useState<SearchTab>("flights");
  const [tripType, setTripType] = useState<"roundtrip" | "oneway">("roundtrip");

  // Flight fields
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  // Hotel fields
  const [hotelCity, setHotelCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  // Car fields
  const [carCity, setCarCity] = useState("");
  const [carPickup, setCarPickup] = useState("");
  const [carReturn, setCarReturn] = useState("");

  // Tour fields
  const [tourCity, setTourCity] = useState("");
  const [tourDate, setTourDate] = useState("");
  const [tourGuests, setTourGuests] = useState(2);

  // Transfer fields
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [transferPassengers, setTransferPassengers] = useState(2);

  useEffect(() => {
    const loadPromo = async () => {
      const [urlRes, typeRes] = await Promise.all([
        supabase.from("site_settings").select("setting_value").eq("setting_key", "promo_media_url").maybeSingle(),
        supabase.from("site_settings").select("setting_value").eq("setting_key", "promo_media_type").maybeSingle(),
      ]);
      if (urlRes.data?.setting_value) setPromoUrl(urlRes.data.setting_value);
      if (typeRes.data?.setting_value) setPromoType(typeRes.data.setting_value as "video" | "image");
    };
    loadPromo();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const disablePast = (date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0));

  const handleSearch = () => {
    if (searchTab === "flights") {
      if (!fromCity || !toCity || !departDate) {
        toast({ title: "بيانات ناقصة", description: "يرجى تحديد مدينة المغادرة والوصول وتاريخ الذهاب", variant: "destructive" });
        return;
      }
      const params = new URLSearchParams({
        from: fromCity,
        to: toCity,
        depart: departDate,
        passengers: String(passengers),
        tripType,
      });
      if (tripType === "roundtrip" && returnDate) params.set("return", returnDate);
      navigate(`/flights?${params.toString()}`);
    } else if (searchTab === "hotels") {
      if (!hotelCity || !checkIn || !checkOut) {
        toast({ title: "بيانات ناقصة", description: "يرجى تحديد المدينة وتواريخ الإقامة", variant: "destructive" });
        return;
      }
      const params = new URLSearchParams({
        city: hotelCity,
        checkIn,
        checkOut,
        guests: String(guests),
      });
      navigate(`/hotels?${params.toString()}`);
    } else if (searchTab === "cars") {
      if (!carCity || !carPickup) {
        toast({ title: "بيانات ناقصة", description: "يرجى تحديد المدينة وتاريخ الاستلام", variant: "destructive" });
        return;
      }
      const params = new URLSearchParams({ city: carCity, pickup: carPickup });
      if (carReturn) params.set("return", carReturn);
      navigate(`/cars?${params.toString()}`);
    } else if (searchTab === "tours") {
      const params = new URLSearchParams();
      if (tourCity) params.set("city", tourCity);
      if (tourDate) params.set("date", tourDate);
      if (tourGuests) params.set("guests", String(tourGuests));
      navigate(`/activities?${params.toString()}`);
    } else if (searchTab === "transfers") {
      if (!transferFrom || !transferDate) {
        toast({ title: "بيانات ناقصة", description: "يرجى تحديد موقع الانطلاق والتاريخ", variant: "destructive" });
        return;
      }
      const params = new URLSearchParams({ from: transferFrom, date: transferDate, passengers: String(transferPassengers) });
      if (transferTo) params.set("to", transferTo);
      navigate(`/transfers?${params.toString()}`);
    }
  };

  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      </div>
      {/* Top Banner */}
      <div className="bg-primary/20 backdrop-blur-sm border-b border-primary/30 py-2 text-center">
        <p className="text-sm text-foreground/80 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          رفيقك الموثوق لكل رحلة من الخليج إلى العالم
        </p>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Right Side - Hero Text + Search */}
          <div className="text-right order-2 lg:order-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              <span className="text-foreground">سافر بثقة مع</span>
              <br />
              <span className="text-gradient-primary text-5xl md:text-6xl lg:text-7xl">خته</span>
            </h1>
            <p className="text-foreground/80 text-base lg:text-lg leading-relaxed mb-8 max-w-xl mr-0">
              باقات سفر متكاملة بأسعار شفافة، مصممة خصيصاً للعائلات والعرسان والمسافرين
              من الخليج. اختر وجهتك ونحن نُتقن التفاصيل.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Button onClick={() => navigate("/flights")} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-base font-bold rounded-xl">
                ابدأ التخطيط الآن
              </Button>
              <Button onClick={() => navigate("/offers")} variant="outline" className="border-foreground/30 text-foreground hover:bg-foreground/10 px-8 py-3 text-base rounded-xl">
                استكشف باقات الموسم
              </Button>
            </div>

            {/* Search Widget */}
            <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border p-6 shadow-card">
              {/* Search Tabs */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground">
                  {searchTab === "flights" ? "نتائج رحلات الطيران خلال ثوان" :
                   searchTab === "hotels" ? "ابحث عن أفضل الفنادق" :
                   searchTab === "cars" ? "استأجر سيارتك المفضلة" :
                   searchTab === "tours" ? "اكتشف أفضل الجولات" :
                   "احجز نقلك من وإلى المطار"}
                </p>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {([
                    { key: "flights" as SearchTab, icon: Plane, label: "طيران" },
                    { key: "hotels" as SearchTab, icon: Hotel, label: "فنادق" },
                    { key: "cars" as SearchTab, icon: Car, label: "سيارات" },
                    { key: "tours" as SearchTab, icon: Map, label: "جولات" },
                    { key: "transfers" as SearchTab, icon: ArrowRightLeft, label: "نقل" },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSearchTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        searchTab === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {searchTab === "flights" ? (
                <>
                  {/* Trip Type */}
                  <div className="flex gap-2 justify-end mb-4">
                    <button
                      onClick={() => { setTripType("oneway"); setReturnDate(""); }}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        tripType === "oneway" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      ذهاب فقط
                    </button>
                    <button
                      onClick={() => setTripType("roundtrip")}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        tripType === "roundtrip" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      ذهاب وعودة
                    </button>
                  </div>

                  {/* Flight Search Fields */}
                  <div className={`grid grid-cols-2 ${tripType === "roundtrip" ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3 mb-4`}>
                    <CityAutocomplete
                      value={fromCity}
                      onChange={setFromCity}
                      placeholder="من أين؟"
                      showCode
                      inputClassName="bg-muted/50 border-border/50 text-sm text-right"
                    />
                    <CityAutocomplete
                      value={toCity}
                      onChange={setToCity}
                      placeholder="إلى أين؟"
                      showCode
                      inputClassName="bg-muted/50 border-border/50 text-sm text-right"
                    />
                    <DatePickerInput
                      value={departDate}
                      onChange={setDepartDate}
                      placeholder="تاريخ الذهاب"
                      disabled={disablePast}
                      className="bg-muted/50 border-border/50 text-sm"
                    />
                    {tripType === "roundtrip" && (
                      <DatePickerInput
                        value={returnDate}
                        onChange={setReturnDate}
                        placeholder="تاريخ العودة"
                        disabled={(date) => disablePast(date) || (departDate ? date < new Date(departDate) : false)}
                        className="bg-muted/50 border-border/50 text-sm"
                      />
                    )}
                  </div>
                </>
              ) : searchTab === "hotels" ? (
                <>
                  {/* Hotel Search Fields */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                    <HotelAutocomplete
                      value={hotelCity}
                      onChange={setHotelCity}
                      placeholder="المدينة أو اسم الفندق"
                      inputClassName="bg-muted/50 border-border/50 text-sm text-right"
                    />
                    <DatePickerInput
                      value={checkIn}
                      onChange={setCheckIn}
                      placeholder="تسجيل الدخول"
                      disabled={disablePast}
                      className="bg-muted/50 border-border/50 text-sm"
                    />
                    <DatePickerInput
                      value={checkOut}
                      onChange={setCheckOut}
                      placeholder="تسجيل الخروج"
                      disabled={(date) => disablePast(date) || (checkIn ? date <= new Date(checkIn) : false)}
                      className="bg-muted/50 border-border/50 text-sm"
                    />
                  </div>
                </>
              ) : searchTab === "cars" ? (
                <>
                  {/* Car Rental Fields */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                    <CityAutocomplete
                      value={carCity}
                      onChange={setCarCity}
                      placeholder="مدينة الاستلام"
                      inputClassName="bg-muted/50 border-border/50 text-sm text-right"
                    />
                    <DatePickerInput
                      value={carPickup}
                      onChange={setCarPickup}
                      placeholder="تاريخ الاستلام"
                      disabled={disablePast}
                      className="bg-muted/50 border-border/50 text-sm"
                    />
                    <DatePickerInput
                      value={carReturn}
                      onChange={setCarReturn}
                      placeholder="تاريخ الإرجاع"
                      disabled={(date) => disablePast(date) || (carPickup ? date <= new Date(carPickup) : false)}
                      className="bg-muted/50 border-border/50 text-sm"
                    />
                  </div>
                </>
              ) : searchTab === "tours" ? (
                <>
                  {/* Tours Fields */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                    <CityAutocomplete
                      value={tourCity}
                      onChange={setTourCity}
                      placeholder="المدينة"
                      inputClassName="bg-muted/50 border-border/50 text-sm text-right"
                    />
                    <DatePickerInput
                      value={tourDate}
                      onChange={setTourDate}
                      placeholder="تاريخ الجولة"
                      disabled={disablePast}
                      className="bg-muted/50 border-border/50 text-sm"
                    />
                    <div className="bg-muted/50 rounded-xl px-3 py-2 flex items-center gap-2 border border-border/50 h-10">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground flex-1 text-right">عدد الأشخاص</span>
                      <button type="button" aria-label="تقليل عدد الأشخاص" onClick={() => setTourGuests(Math.max(1, tourGuests - 1))} className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm font-medium min-w-[16px] text-center">{tourGuests}</span>
                      <button type="button" aria-label="زيادة عدد الأشخاص" onClick={() => setTourGuests(Math.min(20, tourGuests + 1))} className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Transfers Fields */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                    <CityAutocomplete
                      value={transferFrom}
                      onChange={setTransferFrom}
                      placeholder="من (مطار / مدينة)"
                      showCode
                      inputClassName="bg-muted/50 border-border/50 text-sm text-right"
                    />
                    <CityAutocomplete
                      value={transferTo}
                      onChange={setTransferTo}
                      placeholder="إلى (اختياري)"
                      showCode
                      inputClassName="bg-muted/50 border-border/50 text-sm text-right"
                    />
                    <DatePickerInput
                      value={transferDate}
                      onChange={setTransferDate}
                      placeholder="تاريخ الرحلة"
                      disabled={disablePast}
                      className="bg-muted/50 border-border/50 text-sm"
                    />
                  </div>
                </>
              )}

              {/* Passengers/Guests + Search Button */}
              <div className="flex items-center justify-between">
                <Button
                  onClick={handleSearch}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-xl font-bold"
                >
                  <Search className="w-4 h-4 ml-2" />
                  ابحث الآن
                </Button>
                {(searchTab === "flights" || searchTab === "hotels" || searchTab === "transfers") && (
                <div className="bg-muted/50 rounded-xl px-3 py-2 flex items-center gap-2 border border-border/50">
                  <button
                    type="button"
                    aria-label="زيادة عدد المسافرين"
                    onClick={() => {
                      if (searchTab === "flights") setPassengers(Math.min(9, passengers + 1));
                      else if (searchTab === "hotels") setGuests(Math.min(9, guests + 1));
                      else setTransferPassengers(Math.min(20, transferPassengers + 1));
                    }}
                    className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-medium text-foreground min-w-[20px] text-center">
                    {searchTab === "flights" ? passengers : searchTab === "hotels" ? guests : transferPassengers}
                  </span>
                  <button
                    type="button"
                    aria-label="تقليل عدد المسافرين"
                    onClick={() => {
                      if (searchTab === "flights") setPassengers(Math.max(1, passengers - 1));
                      else if (searchTab === "hotels") setGuests(Math.max(1, guests - 1));
                      else setTransferPassengers(Math.max(1, transferPassengers - 1));
                    }}
                    className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                )}
              </div>
            </div>
          </div>

          {/* Left Side - Promo + Info Cards */}
          <div className="order-1 lg:order-2 space-y-6">
            {/* Info Label */}
            <div className="text-right">
              <span className="text-sm text-primary font-medium">تعرّف علينا</span>
              <h3 className="text-xl font-bold text-foreground mt-1">خته — رحلتك تبدأ من هنا</h3>
            </div>

            {/* Promo Media */}
            <div className="rounded-2xl overflow-hidden border border-border/50 bg-card/60 backdrop-blur aspect-video">
              {promoUrl ? (
                promoType === "video" ? (
                  <video src={promoUrl} controls autoPlay muted loop playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={promoUrl} alt="عرض دعائي" className="w-full h-full object-cover" loading="lazy" />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full border-2 border-primary/50 flex items-center justify-center">
                    <Play className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">لا يوجد فيديو مرفوع بعد</p>
                </div>
              )}
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card/60 backdrop-blur border border-border/50 rounded-xl p-4 text-right">
                <div className="flex items-center gap-2 justify-end mb-2">
                  <h4 className="font-bold text-sm text-foreground">باقات متكاملة</h4>
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">طيران + فندق + أنشطة + تنقلات بسعر واحد.</p>
              </div>
              <div className="bg-card/60 backdrop-blur border border-border/50 rounded-xl p-4 text-right">
                <div className="flex items-center gap-2 justify-end mb-2">
                  <h4 className="font-bold text-sm text-foreground">دعم على مدار الساعة</h4>
                  <Headphones className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">فريق يتحدث العربية متاح لمساعدتك دائماً.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
