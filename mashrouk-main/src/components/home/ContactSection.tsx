import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { useState } from "react";

export default function ContactSection() {
  const [email, setEmail] = useState("");

  return (
    <>
      <section className="py-10 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Form */}
            <div className="text-right">
              <h2 className="text-2xl font-bold text-foreground mb-2">تواصل معنا</h2>
              <p className="text-muted-foreground mb-5 text-sm">اترك رسالتك وسنعود إليك بأقرب وقت.</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="الاسم الكامل" className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors text-right" />
                  <input type="email" placeholder="البريد الإلكتروني" className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors text-right" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="الوجهة" className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors text-right" />
                  <input type="tel" placeholder="رقم الجوال" className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors text-right" />
                </div>
                <textarea placeholder="اكتب رسالتك..." rows={3} className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors text-right resize-none" />
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold">
                  <Send className="w-4 h-4 ml-2" />
                  إرسال
                </Button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-5 text-right">
                <h3 className="font-bold text-foreground mb-4">قنوات التواصل</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 justify-end">
                    <div>
                      <p className="text-xs text-muted-foreground">اتصال مباشر</p>
                      <p className="text-sm text-foreground font-medium" dir="ltr">+966 54 245 4094</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <div>
                      <p className="text-xs text-muted-foreground">البريد</p>
                      <p className="text-sm text-foreground font-medium">info@khattah.com</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <div>
                      <p className="text-xs text-muted-foreground">المكتب</p>
                      <p className="text-sm text-foreground font-medium">الرياض، المملكة العربية السعودية</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5 text-right">
                <div className="flex items-center gap-3 justify-end mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">مساعد خته الذكي</h3>
                    <p className="text-xs text-muted-foreground">إجابات فورية على واتساب</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <Button className="bg-green-600 text-white hover:bg-green-700 rounded-xl w-full font-bold">
                  تحويل للواتساب
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-6 border-t border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدك الإلكتروني"
                className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary w-64 text-right"
              />
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6">
                اشترك
              </Button>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-foreground">اشترك في نشرتنا</h3>
              <p className="text-xs text-muted-foreground">أفضل العروض والخصومات الحصرية</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
