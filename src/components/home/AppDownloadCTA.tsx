import { Button } from "@/components/ui/button";
import { Smartphone, CheckCircle2 } from "lucide-react";

const features = [
  "تتبع حجوزاتك لحظياً",
  "عروض حصرية للتطبيق",
  "تنبيهات فورية لأفضل الأسعار",
];

export default function AppDownloadCTA() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 lg:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-right">
              <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-3">
                <Smartphone className="w-4 h-4" />
                تطبيق خته
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">عروض حصرية في جيبك</h2>
              <div className="space-y-2 mb-6">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-2 justify-end text-sm text-foreground/80">
                    <span>{f}</span>
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  </div>
                ))}
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8 font-bold">
                حمّل التطبيق
              </Button>
            </div>
            <div className="w-48 h-48 bg-primary/10 rounded-3xl flex items-center justify-center shrink-0">
              <Smartphone className="w-20 h-20 text-primary/40" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
