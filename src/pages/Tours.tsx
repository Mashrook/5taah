import { useState, useEffect } from "react";
import { Sparkles, Check, Calendar, MapPin, Clock, Users, Star, ChevronLeft, Plane, Hotel, Bus, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import hajjImg from "@/assets/seasonal/hajj-programs.jpg";
import ramadanImg from "@/assets/seasonal/ramadan-offers.jpg";
import summerImg from "@/assets/seasonal/summer-abha.jpg";

const staticPrograms = [
  { title: "برامج الحج", description: "خطط لحج لا يُنسى مع باقاتنا المتكاملة.", image: hajjImg, duration: "10 - 15 يوم", price: 9500, rating: 4.7, reviews: 235, transport: "طيران", hotel: "5 نجوم" },
  { title: "عروض رمضان", description: "استمتع بروحانية شهر رمضان في مكة والمدينة.", image: ramadanImg, duration: "7 - 10 أيام", price: 4800, rating: 4.9, reviews: 312, transport: "حافلة", hotel: "4 نجوم" },
  { title: "صيف عسير", description: "اكتشف جمال الطبيعة في عسير خلال الصيف.", image: summerImg, duration: "5 - 7 أيام", price: 2750, rating: 4.6, reviews: 189, transport: "سيارة خاصة", hotel: "منتجع" },
];

const whyChooseUs = [
  "باقات فريدة ترضي جميع العائلات مع خيارات الإقامة الفاخرة والأنشطة المتنوعة",
  "تنسيق مثالي للرحلات الداخلية والدولية من مكان واحد مريح",
  "خدمات إضافية مثل التأمين والمطاعم وإنشاء جداول زمنية خاصة",
  "أسعار تنافسية بدون رسوم مخفية — قيمة حقيقية لكل ريال",
];

interface DbTour {
  id: string;
  title: string;
  city: string;
  duration: string;
  price: number;
  currency: string;
  category: string;
  image_url: string | null;
  description: string | null;
}

export default function Tours() {
  const navigate = useNavigate();
  const [dbTours, setDbTours] = useState<DbTour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("tours").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => {
        setDbTours((data as DbTour[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-orange-600 pt-10 pb-20">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <p className="text-white/80 text-sm mb-2">مواسم خته المميزة</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-3">
            سافر في الوقت المناسب بأفضل قيمة
          </h1>
          <p className="text-white/80 text-sm lg:text-base max-w-2xl mx-auto">
            برامج رمضان والحج والإجازة الصيفية وموسم الشتاء — باقات متكاملة للإقامة والنقل والخدمات تناسب العائلة الخليجية
          </p>
        </div>
      </section>

      {/* DB Tours */}
      {dbTours.length > 0 && (
        <div className="container mx-auto px-4 lg:px-8 py-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              الجولات المتاحة ({dbTours.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dbTours.map((tour) => (
                <div key={tour.id} className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/20 transition-all group">
                  <div className="relative h-48 overflow-hidden">
                    {tour.image_url ? (
                      <img src={tour.image_url} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {tour.category && (
                      <Badge className="absolute top-3 right-3 bg-card-sm text-foreground border-0 text-xs">{tour.category}</Badge>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-base mb-2">{tour.title}</h3>
                    {tour.description && <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{tour.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      {tour.duration && (
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{tour.duration}</span>
                      )}
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{tour.city}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <span className="text-lg font-bold text-primary">{Number(tour.price).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground mr-1">{tour.currency}</span>
                      </div>
                      <Button variant="gold" size="sm" onClick={() => {
                        const params = new URLSearchParams({
                          id: tour.id, title: tour.title, city: tour.city,
                          duration: tour.duration || "", category: tour.category || "",
                          price: String(tour.price), currency: tour.currency,
                        });
                        navigate(`/tour-booking?${params.toString()}`);
                      }}>احجز الآن</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></div>
      )}

      <div className="container mx-auto px-4 lg:px-8 -mt-4">
        {/* Top Grid: Why Choose Us + First Two Programs */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto mb-8">
          <div className="rounded-2xl bg-card border border-border p-6 lg:p-8 flex flex-col justify-between order-2 lg:order-1">
            <div>
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                لماذا تختار مواسم خته؟
              </h2>
              <ul className="space-y-3 mb-6">
                {whyChooseUs.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button variant="gold" size="lg" className="w-full" onClick={() => navigate("/contact")}>
              ابدأ التخطيط الآن
            </Button>
          </div>
          <div className="order-1 lg:order-2">
            <ProgramCard program={staticPrograms[0]} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto mb-8">
          <ProgramCard program={staticPrograms[1]} />
          <ProgramCard program={staticPrograms[2]} />
        </div>
      </div>

      {/* Newsletter CTA */}
      <section className="bg-primary/20 border-t border-primary/10">
        <div className="container mx-auto px-4 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div className="text-center md:text-right">
              <h3 className="text-xl font-bold mb-1">اشترك في نشرتنا البريدية</h3>
              <p className="text-muted-foreground text-sm">احصل على أفضل العروض والخصومات الحصرية</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="email" placeholder="بريدك الإلكتروني" className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary" dir="ltr" />
              <Button variant="gold">اشترك الآن</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProgramCard({ program }: { program: typeof staticPrograms[0] }) {
  const navigate = useNavigate();
  const handleBook = () => {
    const params = new URLSearchParams({
      title: program.title,
      city: "",
      duration: program.duration,
      category: program.transport,
      price: String(program.price),
      currency: "SAR",
    });
    navigate(`/tour-booking?${params.toString()}`);
  };

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/20 transition-all group lg:h-[420px]">
      <div className="relative h-48 overflow-hidden">
        <img src={program.image} alt={program.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <Badge className="absolute top-3 right-3 bg-card-sm text-foreground border-0 text-xs">{program.transport}</Badge>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-sm font-semibold">{program.rating}</span>
          <span className="text-xs text-muted-foreground">({program.reviews} تقييم)</span>
        </div>
        <h3 className="font-bold text-base mb-2">{program.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">{program.description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{program.duration}</span>
          <span className="flex items-center gap-1"><Hotel className="w-3.5 h-3.5" />{program.hotel}</span>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <span className="text-lg font-bold text-primary">{program.price.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground mr-1">ر.س</span>
          </div>
          <Button variant="gold" size="sm" onClick={handleBook}>احجز الآن</Button>
        </div>
      </div>
    </div>
  );
}
