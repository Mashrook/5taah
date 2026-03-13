import { Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import riyadhImg from "@/assets/destinations/riyadh.jpg";
import jeddahImg from "@/assets/destinations/jeddah.jpg";
import alulaImg from "@/assets/destinations/alula.jpg";
import medinaImg from "@/assets/destinations/medina.jpg";
import abhaImg from "@/assets/destinations/abha.jpg";
import taifImg from "@/assets/offers/taif-cool.jpg";

const packages = [
  { title: "عطلة الرياض العائلية", discount: "خصم 20%", location: "الرياض", price: "1,920", tags: ["إقامة 2 ليالي", "تنقلات"], image: riyadhImg, href: "/tours" },
  { title: "باقة جدة البحرية", discount: "خصم 25%", location: "جدة", price: "2,325", tags: ["رحلة بحرية", "إقامة ليلتين"], image: jeddahImg, href: "/tours" },
  { title: "عرض شتاء العلا", discount: "خصم 35%", location: "العلا", price: "2,730", tags: ["3 ليالي", "مدائن صالح"], image: alulaImg, href: "/tours" },
  { title: "زيارة المدينة المنورة", discount: "خصم 15%", location: "المدينة", price: "1,615", tags: ["ليلتين", "إفطار"], image: medinaImg, href: "/tours" },
  { title: "رحلة أبها الجبلية", discount: "خصم 22%", location: "أبها", price: "2,184", tags: ["3 ليالي", "جولات طبيعية"], image: abhaImg, href: "/tours" },
  { title: "جولة الطائف الباردة", discount: "خصم 18%", location: "الطائف", price: "1,640", tags: ["مزارع ورد", "مرشد محلي"], image: taifImg, href: "/tours" },
];

export default function PopularPackages() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/offers" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="text-right">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">باقات مختارة</h2>
            <p className="text-muted-foreground text-sm mt-1">أكثر الوجهات طلباً بأسعار شفافة</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <Link key={pkg.title} to={pkg.href} className="group">
                <div className="bg-card rounded-2xl shadow-[var(--shadow-card)] overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
                <div className="relative h-48 overflow-hidden">
                  <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">{pkg.discount}</span>
                  </div>
                </div>
                <div className="p-4 text-right">
                  <h3 className="font-bold text-foreground mb-1">{pkg.title}</h3>
                  <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground mb-2">
                    <span>{pkg.location}</span>
                    <MapPin className="w-3 h-3" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {pkg.tags.map((tag) => (
                      <span key={tag} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-primary font-medium">عرض التفاصيل</span>
                    <p className="text-lg font-bold text-primary">{pkg.price} <span className="text-xs text-muted-foreground">ر.س</span></p>
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
