import { useState, useEffect } from "react";
import { GraduationCap, MapPin, Clock, Search, Award, Globe, BookOpen, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";

import londonImg from "@/assets/study/london.jpg";
import sydneyImg from "@/assets/study/sydney.jpg";
import veniceImg from "@/assets/study/venice.jpg";
import singaporeImg from "@/assets/study/singapore.jpg";
import brusselsImg from "@/assets/study/brussels.jpg";
import kualalumpurImg from "@/assets/study/kualalumpur.jpg";

// Fallback images by city
const cityImages: Record<string, string> = {
  "لندن": londonImg,
  "سيدني": sydneyImg,
  "فلورنسا": veniceImg,
  "سنغافورة": singaporeImg,
  "بروكسل": brusselsImg,
  "كوالالمبور": kualalumpurImg,
};

interface StudyProgram {
  id: string;
  title: string;
  city: string;
  country: string;
  country_code: string;
  description: string | null;
  image_url: string | null;
  price: number;
  currency: string;
  duration: string;
  level: string;
  accommodation_type: string | null;
  university_name: string | null;
  tag: string | null;
}

const levelLabels: Record<string, string> = {
  lang: "لغة إنجليزية",
  bachelor: "بكالوريوس",
  master: "ماجستير",
  phd: "دكتوراه",
  diploma: "دبلوم",
};

const studyCountries = [
  { name: "المملكة المتحدة", flag: "🇬🇧", code: "GB", description: "جامعات عريقة مثل أكسفورد وكامبريدج، ثقافة أكاديمية رائدة ومعترف بها عالمياً." },
  { name: "الولايات المتحدة", flag: "🇺🇸", code: "US", description: "أكبر نظام تعليمي في العالم مع جامعات بحثية متميزة وتنوع ثقافي واسع." },
  { name: "كندا", flag: "🇨🇦", code: "CA", description: "بيئة آمنة ومتعددة الثقافات مع جودة تعليم عالية ورسوم معقولة." },
  { name: "أستراليا", flag: "🇦🇺", code: "AU", description: "جامعات مصنّفة عالمياً، طبيعة خلابة وفرص عمل بعد التخرج." },
  { name: "ألمانيا", flag: "🇩🇪", code: "DE", description: "تعليم شبه مجاني في جامعات حكومية مع برامج باللغة الإنجليزية." },
];

const topUniversities = [
  "Imperial College London",
  "Stanford University",
  "Harvard University",
  "University of Oxford",
  "University of Cambridge",
  "National University of Singapore",
  "University of Melbourne",
  "California Institute of Technology",
];

/* ── Program Card ── */
function ProgramCard({ program, onApply }: { program: StudyProgram; onApply: (p: StudyProgram) => void }) {
  const img = program.image_url || cityImages[program.city] || londonImg;

  return (
    <div className="group rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all hover:shadow-lg">
      <div className="relative h-44 overflow-hidden">
        <img src={img} alt={program.city} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 right-4">
          <h3 className="text-lg font-bold text-white">{program.city}</h3>
          <p className="text-xs text-white/80">{program.title}</p>
        </div>
        {program.tag && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs">{program.tag}</Badge>
        )}
        <Badge variant="outline" className="absolute top-3 right-3 bg-black/40 text-white border-white/20 text-xs">
          {levelLabels[program.level] || program.level}
        </Badge>
      </div>
      <div className="p-4">
        {program.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{program.description}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{program.country}</span>
          <span className="mx-1">•</span>
          <Clock className="w-3.5 h-3.5" />
          <span>{program.duration}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-xs text-muted-foreground">يبدأ من</span>
            <p className="text-lg font-bold text-primary">{program.price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ر.س</span></p>
          </div>
          <Button variant="gold" size="sm" onClick={() => onApply(program)}>تقديم طلب</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Application Form Dialog ── */
function ApplicationForm({ program, open, onOpenChange }: { program: StudyProgram | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", nationality: "", notes: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone) {
      toast({ title: "بيانات ناقصة", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("study_applications").insert({
        user_id: user?.id || null,
        program_id: program?.id || null,
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        nationality: form.nationality || null,
        preferred_country: program?.country || null,
        preferred_level: program?.level || null,
        notes: form.notes || null,
      });
      if (error) throw error;
      setSuccess(true);
      toast({ title: "تم إرسال طلبك بنجاح!", description: "سيتواصل معك فريقنا خلال 24 ساعة" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ";
      toast({ title: "خطأ", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setSuccess(false);
      setForm({ fullName: "", email: "", phone: "", nationality: "", notes: "" });
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">
            {success ? "✅ تم إرسال الطلب" : program ? `تقديم على: ${program.title}` : "طلب استشارة دراسية"}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
            <p className="text-foreground font-bold text-lg">شكراً لك!</p>
            <p className="text-muted-foreground text-sm">تم استلام طلبك بنجاح. سيتواصل معك أحد مستشارينا خلال 24 ساعة.</p>
            <Button variant="gold" onClick={() => handleClose(false)}>إغلاق</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {program && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border text-right">
                <p className="text-sm font-bold">{program.title} — {program.city}</p>
                <p className="text-xs text-muted-foreground">{program.duration} • {program.price.toLocaleString()} ر.س</p>
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground block mb-1">الاسم الكامل *</label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="الاسم الثلاثي" className="text-right" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">البريد الإلكتروني *</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" dir="ltr" required />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">رقم الجوال *</label>
                <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+966..." dir="ltr" required />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">الجنسية</label>
              <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="مثلاً: سعودي" className="text-right" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">ملاحظات إضافية</label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="أي تفاصيل إضافية تودّ مشاركتها..." className="text-right" rows={3} />
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}
              إرسال الطلب
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">بالضغط على إرسال، أنت توافق على سياسة الخصوصية الخاصة بنا.</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ── */
export default function StudyAbroad() {
  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Application dialog state
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<StudyProgram | null>(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      const { data, error } = await supabase
        .from("study_programs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (!error && data) setPrograms(data as StudyProgram[]);
      setLoading(false);
    };
    fetchPrograms();
  }, []);

  const filtered = programs.filter((p) => {
    if (countryFilter !== "all" && p.country !== countryFilter) return false;
    if (levelFilter !== "all" && p.level !== levelFilter) return false;
    if (searchQuery && !p.title.includes(searchQuery) && !p.city.includes(searchQuery) && !p.country.includes(searchQuery)) return false;
    return true;
  });

  const handleApply = (p: StudyProgram) => {
    setSelectedProgram(p);
    setApplyOpen(true);
  };

  const handleConsultation = () => {
    setSelectedProgram(null);
    setApplyOpen(true);
  };

  const uniqueCountries = [...new Set(programs.map((p) => p.country))];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background pt-10 pb-16">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full mb-4">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground/80">الدراسة بالخارج مع خته</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold text-foreground mb-3">استثمر في مستقبل أبنائك بثقة</h1>
          <p className="text-muted-foreground text-sm lg:text-base max-w-2xl mx-auto mb-6">
            وفّر لهم فرصة دراسية في أفضل المعاهد والجامعات العالمية — مع السكن والدعم والمتابعة المتكاملة.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="gold" size="lg" onClick={handleConsultation}>
              <Send className="w-4 h-4 ml-2" />
              طلب استشارة مجانية
            </Button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-card/95 border border-border shadow-sm">
            <h2 className="text-lg font-bold text-center mb-4">ابحث عن برنامجك المثالي</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">الدولة</label>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="bg-muted/20"><SelectValue placeholder="جميع الدول" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الدول</SelectItem>
                    {uniqueCountries.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">المستوى</label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="bg-muted/20"><SelectValue placeholder="جميع المستويات" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستويات</SelectItem>
                    {Object.entries(levelLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">بحث</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="اسم المدينة أو البرنامج..."
                    className="bg-muted/20 pr-9 text-right"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">البرامج الدراسية المتاحة</h2>
            <p className="text-muted-foreground text-sm">
              {filtered.length > 0 ? `${filtered.length} برنامج متاح` : "لا توجد برامج تطابق بحثك"}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <ProgramCard key={p.id} program={p} onApply={handleApply} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Countries + Universities */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-bold mb-6">أفضل الدول للدراسة والتطوير</h2>
              <div className="space-y-3">
                {studyCountries.map((c) => (
                  <div
                    key={c.name}
                    className="p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-all cursor-pointer"
                    onClick={() => setCountryFilter(c.name === countryFilter ? "all" : c.name)}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-2xl">{c.flag}</span>
                      <h3 className="font-bold">{c.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground pr-10 leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">جامعات عالمية بارزة</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                نساعدك بالتقديم والحصول على قبولات جامعية مشروطة وغير مشروطة من أفضل جامعات العالم.
              </p>
              <div className="space-y-2.5 mb-6">
                {topUniversities.map((uni, i) => (
                  <div key={uni} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{i + 1}</span>
                    <span className="text-sm font-medium" dir="ltr">{uni}</span>
                  </div>
                ))}
              </div>
              <Button variant="gold" className="w-full" onClick={handleConsultation}>
                <GraduationCap className="w-5 h-5 ml-2" />
                طلب استشارة دراسية
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Dialog */}
      <ApplicationForm program={selectedProgram} open={applyOpen} onOpenChange={setApplyOpen} />
    </div>
  );
}
