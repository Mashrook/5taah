import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import jeddahBoatImg from "@/assets/activities/jeddah-boat.jpg";
import diriyahImg from "@/assets/destinations/diriyah.jpg";
import alulaImg from "@/assets/destinations/alula.jpg";
import taifMarketImg from "@/assets/activities/taif-market.jpg";

const activities = [
  { title: "جولة بحرية في جدة", location: "جدة", category: "بحرية", price: "180", image: jeddahBoatImg, href: "/tours" },
  { title: "زيارة الدرعية التاريخية", location: "الرياض", category: "ثقافية", price: "120", image: diriyahImg, href: "/tours" },
  { title: "رحلة هضاب العلا", location: "العلا", category: "طبيعة", price: "260", image: alulaImg, href: "/tours" },
  { title: "أسواق الطائف التقليدية", location: "الطائف", category: "سوق", price: "90", image: taifMarketImg, href: "/tours" },
];

export default function ActivitiesSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/tours" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="text-right">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">تجارب وأنشطة</h2>
            <p className="text-muted-foreground text-sm mt-1">تجارب مميزة حسب اهتماماتك</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {activities.map((activity) => (
            <Link key={activity.title} to={activity.href} className="group">
                <div className="bg-card rounded-2xl shadow-[var(--shadow-card)] overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
                <div className="relative h-40 overflow-hidden">
                  <img src={activity.image} alt={activity.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute top-3 right-3">
                    <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-lg">{activity.category}</span>
                  </div>
                </div>
                <div className="p-3.5 text-right">
                  <h3 className="font-bold text-foreground text-sm mb-0.5">{activity.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{activity.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-primary font-medium">احجز</span>
                    <p className="font-bold text-primary">{activity.price} <span className="text-[11px] text-muted-foreground">ر.س</span></p>
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
