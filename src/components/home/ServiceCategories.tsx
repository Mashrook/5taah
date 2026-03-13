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
    <section className="py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center overflow-x-auto scrollbar-hide gap-4 md:gap-6 lg:justify-center pb-2">
          {services.map((s) => (
            <Link key={s.href} to={s.href} className="shrink-0">
              <div className="flex flex-col items-center gap-2 group cursor-pointer w-20">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.color} group-hover:scale-110 transition-transform shadow-sm`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-foreground text-center leading-tight">{s.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
