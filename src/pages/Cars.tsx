import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Car, Star, MapPin, Users, Fuel, Settings2, Search, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CityAutocomplete from "@/components/search/CityAutocomplete";
import DatePickerInput from "@/components/ui/date-picker-input";
import { supabase } from "@/integrations/supabase/client";
import { getCarDeeplink } from "@/lib/travelpayoutsClient";

import economyImg from "@/assets/cars/economy-car.jpg";
import midsizeImg from "@/assets/cars/midsize-car.jpg";
import suvImg from "@/assets/cars/suv-car.jpg";
import luxuryImg from "@/assets/cars/luxury-car.jpg";
import familyImg from "@/assets/cars/family-car.jpg";
import sportImg from "@/assets/cars/sport-car.jpg";

const fallbackImages: Record<string, string> = {
  "economy": economyImg, "اقتصادي": economyImg,
  "midsize": midsizeImg, "متوسط": midsizeImg,
  "suv": suvImg, "SUV": suvImg,
  "luxury": luxuryImg, "فاخر": luxuryImg,
  "family": familyImg, "عائلي": familyImg,
  "sport": sportImg, "رياضي": sportImg,
};

const staticCarCategories = [
  { name: "اقتصادي", image: economyImg, price: 120, seats: 5, fuel: "بنزين", transmission: "أوتوماتيك", models: ["تويوتا يارس", "هيونداي أكسنت", "نيسان صني"], category: "economy" },
  { name: "متوسط", image: midsizeImg, price: 200, seats: 5, fuel: "بنزين", transmission: "أوتوماتيك", models: ["تويوتا كامري", "هيونداي سوناتا", "كيا K5"], category: "midsize" },
  { name: "SUV", image: suvImg, price: 350, seats: 7, fuel: "بنزين", transmission: "أوتوماتيك", models: ["تويوتا فورتشنر", "هيونداي سانتافي", "كيا سورينتو"], category: "suv" },
  { name: "فاخر", image: luxuryImg, price: 600, seats: 5, fuel: "بنزين", transmission: "أوتوماتيك", models: ["مرسيدس E-Class", "BMW الفئة 5", "لكزس ES"], category: "luxury" },
  { name: "عائلي", image: familyImg, price: 280, seats: 8, fuel: "بنزين", transmission: "أوتوماتيك", models: ["تويوتا إنوفا", "هيونداي ستاريا", "كيا كرنفال"], category: "family" },
  { name: "رياضي", image: sportImg, price: 800, seats: 2, fuel: "بنزين", transmission: "أوتوماتيك", models: ["فورد موستانج", "شيفروليه كامارو", "دودج تشالنجر"], category: "sport" },
];

interface DbCar {
  id: string;
  name: string;
  brand: string;
  category: string;
  price_per_day: number;
  currency: string;
  city: string;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
}

export default function Cars() {
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();
  const [city, setCity] = useState(urlParams.get("city") || "");
  const [pickupDate, setPickupDate] = useState(urlParams.get("pickup") || "");
  const [returnDate, setReturnDate] = useState(urlParams.get("return") || "");
  const [dbCars, setDbCars] = useState<DbCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerLink, setPartnerLink] = useState("");

  useEffect(() => {
    supabase.from("cars").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => {
        setDbCars((data as DbCar[]) || []);
        setLoading(false);
      });
  }, []);

  // Generate Travelpayouts partner link when search params are available
  useEffect(() => {
    if (city && pickupDate) {
      getCarDeeplink({ city, pickup: pickupDate, dropoff: returnDate || undefined })
        .then(setPartnerLink)
        .catch(() => setPartnerLink(""));
    }
  }, [city, pickupDate, returnDate]);

  const handleSearch = () => {
    if (city && pickupDate) {
      getCarDeeplink({ city, pickup: pickupDate, dropoff: returnDate || undefined })
        .then(setPartnerLink)
        .catch(() => setPartnerLink(""));
    }
  };

  const displayCars = dbCars.length > 0 ? dbCars : null;

  return (
    <div className="min-h-screen">
      {/* Hero + Search */}
      <section className="bg-gradient-to-br from-primary via-primary to-orange-600 pt-8 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">تأجير السيارات</h1>
            <p className="text-white/80 text-sm">استأجر سيارتك المفضلة بأفضل الأسعار في جميع مدن المملكة</p>
          </div>

          <div className="max-w-4xl mx-auto p-6 rounded-2xl bg-card shadow-xl -mt-10 relative z-10">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <CityAutocomplete value={city} onChange={setCity} placeholder="مدينة الاستلام" label="مدينة الاستلام" />
              <div>
                <label className="text-sm text-muted-foreground block mb-1">تاريخ الاستلام</label>
                <DatePickerInput value={pickupDate} onChange={setPickupDate} placeholder="تاريخ الاستلام" disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} className="bg-muted/30" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">تاريخ الإرجاع</label>
                <DatePickerInput value={returnDate} onChange={setReturnDate} placeholder="تاريخ الإرجاع" disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || (pickupDate ? date <= new Date(pickupDate) : false)} className="bg-muted/30" />
              </div>
            </div>
            <Button variant="gold" size="lg" className="w-full" onClick={handleSearch}>
              <Search className="w-5 h-5 ml-2" />
              بحث عن السيارات
            </Button>
            {partnerLink && (
              <a href={partnerLink} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 text-sm text-primary hover:underline">
                <ExternalLink className="w-4 h-4" />
                قارن الأسعار على مواقع التأجير العالمية
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Cars from DB */}
      {displayCars && displayCars.length > 0 && (
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold mb-6">السيارات المتاحة ({displayCars.length})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayCars.map((car) => (
                <div key={car.id} className="group rounded-2xl bg-card border border-border overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={car.image_url || fallbackImages[car.category] || economyImg}
                      alt={car.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">{car.category}</Badge>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-base mb-1">{car.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                      {car.brand && <span>{car.brand}</span>}
                      {car.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{car.city}</span>}
                    </div>
                    {car.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{car.description}</p>}
                    <div className="flex items-end justify-between pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">يبدأ من</p>
                        <p className="text-2xl font-bold text-primary">{Number(car.price_per_day).toLocaleString()} <span className="text-sm font-normal">ر.س / يوم</span></p>
                      </div>
                      <Button variant="gold" size="sm" onClick={() => {
                        const params = new URLSearchParams({
                          id: car.id, name: car.name, category: car.category,
                          city: car.city, price: String(car.price_per_day),
                          currency: car.currency,
                          ...(pickupDate ? { pickup: pickupDate } : {}),
                          ...(returnDate ? { return: returnDate } : {}),
                        });
                        navigate(`/car-booking?${params.toString()}`);
                      }}>احجز الآن</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Static Car Categories (fallback) */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold mb-6">{displayCars ? "فئات السيارات" : "فئات السيارات المتاحة"}</h2>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staticCarCategories.map((car, i) => (
                <div key={i} className="group rounded-2xl bg-card border border-border overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img src={car.image} alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">{car.name}</Badge>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" />{car.seats} مقاعد</span>
                      <span className="flex items-center gap-1"><Fuel className="w-4 h-4" />{car.fuel}</span>
                      <span className="flex items-center gap-1"><Settings2 className="w-4 h-4" />{car.transmission}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{car.models.join(" • ")}</p>
                    <div className="flex items-end justify-between pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">يبدأ من</p>
                        <p className="text-2xl font-bold text-primary">{car.price} <span className="text-sm font-normal">ر.س / يوم</span></p>
                      </div>
                      <Button variant="gold" size="sm" onClick={() => {
                        const params = new URLSearchParams({
                          name: `${car.models[0]}`, category: car.category,
                          city: city || "", price: String(car.price),
                          currency: "SAR",
                          ...(pickupDate ? { pickup: pickupDate } : {}),
                          ...(returnDate ? { return: returnDate } : {}),
                        });
                        navigate(`/car-booking?${params.toString()}`);
                      }}>احجز الآن</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
