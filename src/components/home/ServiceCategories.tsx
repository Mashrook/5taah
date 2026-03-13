import { Link } from "react-router-dom";
import { Plane, Hotel, Car, Map, ArrowRightLeft, Tag, PartyPopper, Landmark, GraduationCap, Globe } from "lucide-react";

const services = [
  { href: "/flights", label: "حجز طيران", desc: "أفضل أسعار الرحلات", icon: Plane, color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
  { href: "/hotels", label: "فنادق", desc: "إقامة مريحة", icon: Hotel, color: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" },
  { href: "/cars", label: "تأجير سيارات", desc: "سيارات متنوعة", icon: Car, color: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" },
  { href: "/activities", label: "جولات سياحية", desc: "تجارب ممتعة", icon: Map, color: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
  { href: "/transfers", label: "نقل المطار", desc: "من وإلى المطار", icon: ArrowRightLeft, color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400" },
  { href: "/offers", label: "العروض", desc: "خصومات حصرية", icon: Tag, color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400" },
  { href: "/festivals", label: "فعاليات", desc: "أحداث وموسم", icon: PartyPopper, color: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400" },
  { href: "/saudi-tourism", label: "سياحة السعودية", desc: "اكتشف المملكة", icon: Landmark, color: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400" },
  { href: "/tours", label: "المواسم", desc: "باقات موسمية", icon: Globe, color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" },
  { href: "/study-abroad", label: "الدراسة بالخارج", desc: "برامج تعليمية", icon: GraduationCap, color: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" },
];

export default function ServiceCategories() {
  return (
    <section className="py-10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">خدماتنا</h2>
          <p className="text-muted-foreground text-sm mt-1">كل ما تحتاجه لرحلتك في مكان واحد</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {services.map((s) => (
            <Link key={s.href} to={s.href}>
              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color} group-hover:scale-110 transition-transform`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
