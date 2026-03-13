import { Link } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import hiltonJeddahImg from "@/assets/hotels/hilton-jeddah.jpg";
import ritzCarltonImg from "@/assets/hotels/ritz-carlton-riyadh.jpg";
import radissonAbhaImg from "@/assets/hotels/radisson-abha.jpg";
import movenpickMedinaImg from "@/assets/hotels/movenpick-medina.jpg";

const hotels = [
  { name: "فندق هيلتون جدة", location: "جدة - الكورنيش", category: "إطلالة بحرية", stars: 5, tags: ["واي فاي", "مسبح", "موقف"], price: "850", image: hiltonJeddahImg, href: "/hotels" },
  { name: "فندق الريتز كارلتون", location: "الرياض - حي الدبلوماسي", category: "فاخر", stars: 5, tags: ["سبا", "إفطار", "صالة رياضية"], price: "1,200", image: ritzCarltonImg, href: "/hotels" },
  { name: "فندق راديسون بلو أبها", location: "أبها - وسط المدينة", category: "إطلالة جبلية", stars: 4, tags: ["إطلالة", "مسبح", "إفطار"], price: "650", image: radissonAbhaImg, href: "/hotels" },
  { name: "فندق موفنبيك المدينة", location: "المدينة - المنطقة المركزية", category: "قريب من الحرم", stars: 4, tags: ["واي فاي", "إفطار", "خدمة 24/7"], price: "950", image: movenpickMedinaImg, href: "/hotels" },
];

export default function FeaturedHotels() {
  return (
    <section className="py-10 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/hotels" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="text-right">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">فنادق مميزة</h2>
            <p className="text-muted-foreground text-sm mt-1">إقامات موثوقة بمواقع مركزية</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {hotels.map((hotel) => (
            <Link key={hotel.name} to={hotel.href} className="group">
              <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative h-44 overflow-hidden">
                  <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute top-3 right-3">
                    <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-lg">{hotel.category}</span>
                  </div>
                </div>
                <div className="p-3.5 text-right">
                  <h3 className="font-bold text-foreground text-sm mb-0.5">{hotel.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{hotel.location}</p>
                  <div className="flex items-center gap-0.5 justify-end mb-2">
                    {Array.from({ length: hotel.stars }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {hotel.tags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-primary font-medium">احجز</span>
                    <p className="font-bold text-primary">{hotel.price} <span className="text-[11px] text-muted-foreground">ر.س</span></p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
