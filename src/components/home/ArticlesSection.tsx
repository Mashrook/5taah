import { Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import alulaImg from "@/assets/destinations/alula.jpg";
import jeddahImg from "@/assets/destinations/jeddah.jpg";
import riyadhImg from "@/assets/destinations/riyadh.jpg";
import abhaImg from "@/assets/destinations/abha.jpg";
import medinaImg from "@/assets/destinations/medina.jpg";
import redSeaImg from "@/assets/tours/red-sea.jpg";

const articles = [
  { title: "دليل السفر إلى العلا", date: "2026-02-01", category: "وجهات", image: alulaImg },
  { title: "أفضل الأنشطة في جدة", date: "2026-01-20", category: "نشاطات", image: jeddahImg },
  { title: "الرياض الحديثة: ماذا تزور؟", date: "2026-01-10", category: "مدن", image: riyadhImg },
  { title: "شتاء أبها وكيف تستمتع به", date: "2025-12-22", category: "مواسم", image: abhaImg },
  { title: "دليل زيارة المدينة المنورة", date: "2025-12-05", category: "روحانيات", image: medinaImg },
  { title: "أفضل وجهات الربيع في السعودية", date: "2025-11-18", category: "مواسم", image: redSeaImg },
];

export default function ArticlesSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/articles" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            جميع المقالات
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="text-right">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">دليلك للسفر</h2>
            <p className="text-muted-foreground text-sm mt-1">مقالات ونصائح عملية لاختيار الوجهة المناسبة</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article) => (
            <Link key={article.title} to="/articles" className="group">
                <div className="bg-card rounded-2xl shadow-[var(--shadow-card)] overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
                <div className="relative h-40 overflow-hidden">
                  <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute top-3 right-3">
                    <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-lg">{article.category}</span>
                  </div>
                </div>
                <div className="p-4 text-right">
                  <h3 className="font-bold text-foreground text-sm mb-2">{article.title}</h3>
                  <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                    <span>{article.date}</span>
                    <Calendar className="w-3 h-3" />
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
