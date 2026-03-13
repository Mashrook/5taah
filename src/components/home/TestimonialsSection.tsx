import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "أحمد العتيبي",
    location: "الرياض",
    text: "حجزت رحلة عائلية إلى دبي وكانت كل التفاصيل جاهزة — الأسعار شفافة والخدمة احترافية.",
    rating: 5,
  },
  {
    name: "سارة المطيري",
    location: "جدة",
    text: "باقة شهر عسل في المالديف كانت تجربة لا تُنسى. فريق الدعم ساعدنا في كل خطوة.",
    rating: 5,
  },
  {
    name: "محمد الشهري",
    location: "الدمام",
    text: "سهولة في الحجز وتأكيد فوري. باقات شاملة بدون رسوم خفية. أنصح الجميع!",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-12 bg-secondary/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">آراء العملاء</h2>
          <p className="text-muted-foreground text-sm mt-1">آراء حقيقية من مسافرين جربوا خدماتنا</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-card rounded-2xl shadow-[var(--shadow-card)] p-6 text-right">
              <Quote className="w-8 h-8 text-primary/20 mb-3" />
              <div className="flex gap-0.5 justify-end mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-foreground/90 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="border-t border-border pt-3">
                <p className="font-semibold text-foreground text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
