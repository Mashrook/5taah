import { Users, Globe, Shield, Star, Target, Compass, HeartHandshake, BarChart3 } from "lucide-react";

const highlights = [
  { icon: Globe, title: "تغطية واسعة", desc: "حجوزات طيران وفنادق وسيارات وجولات داخل المملكة وخارجها." },
  { icon: Shield, title: "حجوزات آمنة", desc: "حماية متقدمة لبيانات المستخدم وعمليات الدفع والتحقق." },
  { icon: Star, title: "جودة التجربة", desc: "تحسين مستمر لتدفق الحجز من البحث حتى إصدار التأكيد." },
  { icon: Users, title: "دعم تشغيلي", desc: "فريق دعم وتقنية لمتابعة الحالات الحساسة ومعالجة الأعطال بسرعة." },
];

const values = [
  { icon: Target, title: "الوضوح", desc: "واجهة حجز مباشرة بدون خطوات غير ضرورية." },
  { icon: Compass, title: "الدقة", desc: "الاعتماد على بيانات فعلية من مزودي الخدمات." },
  { icon: HeartHandshake, title: "الالتزام", desc: "متابعة ما بعد الدفع حتى استقرار نتيجة الحجز." },
  { icon: BarChart3, title: "التحسين المستمر", desc: "التحسين بناءً على مؤشرات الأداء والتحويل." },
];

export default function About() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            من <span className="text-primary">نحن</span>
          </h1>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            منصة خُتّه تجمع خدمات السفر الأساسية في مسار واحد: البحث، اختيار العرض، إدخال بيانات المسافر، ثم الدفع.
            نركز على الاستقرار التشغيلي وربط الأنظمة الفعلية مثل Amadeus وTravelpayouts لتقديم نتائج حية قابلة للتنفيذ.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-10">
          {highlights.map((item) => (
            <div key={item.title} className="text-center p-6 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto rounded-2xl bg-card border border-border p-6 lg:p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">كيف نعمل</h2>
          <p className="text-muted-foreground text-sm leading-relaxed text-center max-w-4xl mx-auto mb-6">
            نمشي بتدفق واضح: اختيار الخدمة، إدخال بيانات المسافر، مراجعة الطلب، ثم الدفع.
            بعد نجاح الدفع يتم التحقق والتسجيل عبر طبقة خادم مركزية لضمان اتساق البيانات مع سياسات الأمان.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <v.icon className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">{v.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
