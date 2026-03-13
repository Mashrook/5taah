import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import hajjImg from "@/assets/seasonal/hajj.jpg";
import ramadanImg from "@/assets/seasonal/ramadan.jpg";
import summerImg from "@/assets/seasonal/summer.jpg";

const packages = [
  {
    title: "عروض رمضان في مكة والمدينة",
    season: "رمضان",
    desc: "إقامة فاخرة قريبة من الحرمين مع إفطار يومي وتنقلات",
    image: ramadanImg,
    tags: ["إقامة 4 نجوم", "إفطار يومي", "تنقلات"],
    price: "2,500",
    href: "/tours",
  },
  {
    title: "برامج الحج المميزة",
    season: "الحج",
    desc: "برامج حج متكاملة مع سكن قريب وإعاشة كاملة وإرشاد ديني",
    image: hajjImg,
    tags: ["سكن قريب", "إعاشة كاملة", "مرشد معتمد"],
    price: "7,500",
    href: "/tours",
  },
  {
    title: "مصايف أبها والباحة",
    season: "الصيف",
    desc: "أجواء معتدلة وطبيعة خلابة مع إقامة فندقية وأنشطة عائلية",
    image: summerImg,
    tags: ["5 ليالي", "جولات طبيعية", "أنشطة عائلية"],
    price: "4,500",
    href: "/tours",
  },
];

export default function SeasonalPackages() {
  return (
    <section className="py-10 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/offers" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">باقات الموسم</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <Link key={pkg.title} to={pkg.href} className="group">
              <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative h-52 overflow-hidden">
                  <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute top-3 right-3">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">{pkg.season}</span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white font-bold text-lg">{pkg.title}</p>
                  </div>
                </div>
                <div className="p-4 text-right">
                  <p className="text-sm text-muted-foreground mb-3">{pkg.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {pkg.tags.map((tag) => (
                      <span key={tag} className="text-[11px] bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">{tag}</span>
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

