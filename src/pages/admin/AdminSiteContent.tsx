import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image, LayoutGrid, Plus, Trash2, Save, Eye, EyeOff, Upload, Loader2, Hotel, Car, Map, Plane, RefreshCw } from "lucide-react";

// ─── Site Images Manager ───
interface SiteImage {
  id?: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
}

// ─── Section Manager ───
interface SiteSection {
  id?: string;
  setting_key: string;
  setting_value: string | null;
  label: string;
}

const DEFAULT_SECTIONS = [
  { key: "section_hero", label: "البانر الرئيسي" },
  { key: "section_featured_offer", label: "العرض المميز" },
  { key: "section_popular_packages", label: "الباقات الشائعة" },
  { key: "section_featured_hotels", label: "الفنادق المميزة" },
  { key: "section_seasonal", label: "العروض الموسمية" },
  { key: "section_activities", label: "الأنشطة" },
  { key: "section_testimonials", label: "آراء العملاء" },
  { key: "section_articles", label: "المقالات" },
  { key: "section_contact", label: "تواصل معنا" },
  { key: "section_app_download", label: "تحميل التطبيق" },
  { key: "section_promo_media", label: "المحتوى الدعائي" },
  { key: "section_study_abroad", label: "الدراسة بالخارج" },
];

const IMAGE_KEYS = [
  { key: "img_hero", label: "صورة البانر الرئيسي", category: "عام" },
  { key: "img_featured_offer", label: "صورة العرض المميز", category: "عام" },
  { key: "img_riyadh", label: "صورة الرياض", category: "وجهات" },
  { key: "img_jeddah", label: "صورة جدة", category: "وجهات" },
  { key: "img_medina", label: "صورة المدينة", category: "وجهات" },
  { key: "img_abha", label: "صورة أبها", category: "وجهات" },
  { key: "img_alula", label: "صورة العلا", category: "وجهات" },
  { key: "img_tabuk", label: "صورة تبوك", category: "وجهات" },
  { key: "img_dubai", label: "صورة دبي", category: "وجهات" },
  { key: "img_diriyah", label: "صورة الدرعية", category: "وجهات" },
  { key: "img_hotel_ritz", label: "فندق الريتز كارلتون", category: "فنادق" },
  { key: "img_hotel_hilton", label: "فندق هيلتون جدة", category: "فنادق" },
  { key: "img_hotel_radisson", label: "فندق راديسون أبها", category: "فنادق" },
  { key: "img_hotel_movenpick", label: "فندق موفنبيك المدينة", category: "فنادق" },
  { key: "img_car_economy", label: "سيارة اقتصادية", category: "سيارات" },
  { key: "img_car_luxury", label: "سيارة فاخرة", category: "سيارات" },
  { key: "img_car_suv", label: "سيارة SUV", category: "سيارات" },
  { key: "img_car_family", label: "سيارة عائلية", category: "سيارات" },
  { key: "img_tour_desert", label: "جولة صحراوية", category: "جولات" },
  { key: "img_tour_redsea", label: "البحر الأحمر", category: "جولات" },
  { key: "img_tour_jeddah", label: "جدة التاريخية", category: "جولات" },
  { key: "img_tour_riyadh", label: "ليل الرياض", category: "جولات" },
  { key: "img_seasonal_hajj", label: "برامج الحج", category: "موسمية" },
  { key: "img_seasonal_ramadan", label: "عروض رمضان", category: "موسمية" },
  { key: "img_seasonal_summer", label: "صيف عسير", category: "موسمية" },
];

const IMAGE_CATEGORIES = ["الكل", "عام", "وجهات", "فنادق", "سيارات", "جولات", "موسمية"];

export default function AdminSiteContent() {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customSettings, setCustomSettings] = useState<SiteImage[]>([]);
  const [addDialog, setAddDialog] = useState(false);
  const [newSetting, setNewSetting] = useState({ key: "", value: "", type: "text", label: "" });
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [imageCategory, setImageCategory] = useState("الكل");
  const [galleryFiles, setGalleryFiles] = useState<{ name: string; url: string; created_at: string }[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const { data } = await supabase.from("site_settings").select("*").is("tenant_id", null);
    const all = data || [];

    // Images
    const imgEntries = IMAGE_KEYS.map((ik) => {
      const found = all.find((s) => s.setting_key === ik.key);
      return { id: found?.id, setting_key: ik.key, setting_value: found?.setting_value || "", setting_type: "url" };
    });
    setImages(imgEntries);

    // Sections
    const secEntries = DEFAULT_SECTIONS.map((ds) => {
      const found = all.find((s) => s.setting_key === ds.key);
      return { id: found?.id, setting_key: ds.key, setting_value: found?.setting_value ?? "true", label: ds.label };
    });
    setSections(secEntries);

    // Custom settings
    const knownKeys = [...IMAGE_KEYS.map((i) => i.key), ...DEFAULT_SECTIONS.map((s) => s.key), "promo_media_url", "promo_media_type"];
    const custom = all.filter((s) => !knownKeys.includes(s.setting_key));
    setCustomSettings(custom.map((c) => ({ id: c.id, setting_key: c.setting_key, setting_value: c.setting_value, setting_type: c.setting_type })));

    setLoading(false);
  };

  const loadGallery = async () => {
    setGalleryLoading(true);
    const { data, error } = await supabase.storage.from("admin-uploads").list("site", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (!error && data) {
      setGalleryFiles(
        data
          .filter(f => f.name && !f.name.startsWith("."))
          .map(f => {
            const { data: urlData } = supabase.storage.from("admin-uploads").getPublicUrl("site/" + f.name);
            return { name: f.name, url: urlData.publicUrl, created_at: f.created_at || "" };
          })
      );
    }
    setGalleryLoading(false);
  };

  const upsertSetting = async (key: string, value: string, type: string = "text") => {
    const { data: existing } = await supabase.from("site_settings").select("id").eq("setting_key", key).is("tenant_id", null).maybeSingle();
    if (existing) {
      await supabase.from("site_settings").update({ setting_value: value }).eq("id", existing.id);
    } else {
      await supabase.from("site_settings").insert({ setting_key: key, setting_value: value, setting_type: type });
    }
  };

  const saveImages = async () => {
    setSaving(true);
    for (const img of images) {
      await upsertSetting(img.setting_key, img.setting_value || "", "url");
    }
    toast({ title: "تم حفظ الصور" });
    setSaving(false);
  };

  const saveSections = async () => {
    setSaving(true);
    for (const sec of sections) {
      await upsertSetting(sec.setting_key, sec.setting_value || "true", "boolean");
    }
    toast({ title: "تم حفظ إعدادات الأقسام" });
    setSaving(false);
  };

  const toggleSection = (key: string) => {
    setSections((prev) => prev.map((s) => s.setting_key === key ? { ...s, setting_value: s.setting_value === "true" ? "false" : "true" } : s));
  };

  const updateImageUrl = (key: string, url: string) => {
    setImages((prev) => prev.map((i) => i.setting_key === key ? { ...i, setting_value: url } : i));
  };

  const handleFileUpload = async (key: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "يرجى اختيار ملف صورة", variant: "destructive" });
      return;
    }
    setUploadingKey(key);
    const ext = file.name.split(".").pop();
    const fileName = `${key}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("admin-uploads").upload("site/" + fileName, file, { upsert: true });
    if (error) {
      toast({ title: "خطأ في الرفع", description: error.message, variant: "destructive" });
      setUploadingKey(null);
      return;
    }
    const { data: publicUrl } = supabase.storage.from("admin-uploads").getPublicUrl("site/" + fileName);
    updateImageUrl(key, publicUrl.publicUrl);
    setUploadingKey(null);
    toast({ title: "تم رفع الصورة بنجاح" });
  };

  const addCustomSetting = async () => {
    if (!newSetting.key) return;
    await upsertSetting(newSetting.key, newSetting.value, newSetting.type);
    toast({ title: "تم إضافة الإعداد" });
    setAddDialog(false);
    setNewSetting({ key: "", value: "", type: "text", label: "" });
    loadAll();
  };

  const deleteCustomSetting = async (id: string) => {
    if (!confirm("هل تريد حذف هذا الإعداد؟")) return;
    await supabase.from("site_settings").delete().eq("id", id);
    toast({ title: "تم حذف الإعداد" });
    loadAll();
  };

  const handleGalleryUpload = async (files: FileList) => {
    setGalleryLoading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop();
      const fileName = `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      await supabase.storage.from("admin-uploads").upload("site/" + fileName, file, { upsert: true });
    }
    toast({ title: `تم رفع ${files.length} صورة بنجاح` });
    loadGallery();
  };

  const deleteGalleryFile = async (name: string) => {
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    await supabase.storage.from("admin-uploads").remove(["site/" + name]);
    toast({ title: "تم حذف الصورة" });
    loadGallery();
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "تم نسخ الرابط" });
  };

  const filteredImages = imageCategory === "الكل" ? images : images.filter(img => {
    const meta = IMAGE_KEYS.find(k => k.key === img.setting_key);
    return meta?.category === imageCategory;
  });

  if (loading) return <div className="p-8 text-center text-muted-foreground" dir="rtl">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المحتوى والأقسام</h1>
          <p className="text-muted-foreground">تعديل الصور وإدارة أقسام الموقع وإعدادات المحتوى</p>
        </div>
        <LayoutGrid className="w-8 h-8 text-primary" />
      </div>

      <Tabs defaultValue="images">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="images"><Image className="w-4 h-4 ml-2" />الصور</TabsTrigger>
          <TabsTrigger value="gallery" onClick={loadGallery}><Upload className="w-4 h-4 ml-2" />معرض الصور</TabsTrigger>
          <TabsTrigger value="sections"><LayoutGrid className="w-4 h-4 ml-2" />الأقسام</TabsTrigger>
          <TabsTrigger value="custom">إعدادات أخرى</TabsTrigger>
        </TabsList>

        {/* ─── Images Tab ─── */}
        <TabsContent value="images">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>صور الموقع ({filteredImages.length})</CardTitle>
                <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                  {IMAGE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setImageCategory(cat)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        imageCategory === cat ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {filteredImages.map((img) => {
                  const meta = IMAGE_KEYS.find((k) => k.key === img.setting_key);
                  const label = meta?.label || img.setting_key;
                  return (
                    <div key={img.setting_key} className="space-y-2 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-all">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">{label}</Label>
                        {meta?.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{meta.category}</span>
                        )}
                      </div>
                      {img.setting_value && (
                        <img src={img.setting_value} alt={label} className="w-full h-32 rounded-lg object-cover border border-border" />
                      )}
                      <div className="flex gap-2 items-center">
                        <Input
                          value={img.setting_value || ""}
                          onChange={(e) => updateImageUrl(img.setting_key, e.target.value)}
                          placeholder="https://..."
                          dir="ltr"
                          className="flex-1 text-xs"
                        />
                        <input
                          ref={(el) => { fileInputRefs.current[img.setting_key] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          title="رفع صورة"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(img.setting_key, file);
                            e.target.value = "";
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRefs.current[img.setting_key]?.click()}
                          disabled={uploadingKey === img.setting_key}
                        >
                          {uploadingKey === img.setting_key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button onClick={saveImages} disabled={saving} className="w-full">
                <Save className="w-4 h-4 ml-2" />{saving ? "جاري الحفظ..." : "حفظ جميع الصور"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Gallery Tab ─── */}
        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>معرض الصور المرفوعة ({galleryFiles.length})</CardTitle>
                <div className="flex gap-2">
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    title="رفع صور للمعرض"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) handleGalleryUpload(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={loadGallery} disabled={galleryLoading}>
                    <RefreshCw className={`w-4 h-4 ml-1 ${galleryLoading ? "animate-spin" : ""}`} />
                    تحديث
                  </Button>
                  <Button size="sm" onClick={() => galleryInputRef.current?.click()}>
                    <Upload className="w-4 h-4 ml-2" />
                    رفع صور
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {galleryLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : galleryFiles.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <Image className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>لا توجد صور مرفوعة بعد</p>
                  <p className="text-xs mt-1">ارفع صوراً لاستخدامها في الموقع</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryFiles.map((file) => (
                    <div key={file.name} className="group relative rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all">
                      <img src={file.url} alt={file.name} className="w-full h-32 object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" className="text-xs h-7" onClick={() => copyToClipboard(file.url)}>
                          نسخ الرابط
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => deleteGalleryFile(file.name)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] text-muted-foreground truncate" dir="ltr">{file.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Sections Tab ─── */}
        <TabsContent value="sections">
          <Card>
            <CardHeader><CardTitle>إدارة أقسام الصفحة الرئيسية</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {sections.map((sec) => (
                <div key={sec.setting_key} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    {sec.setting_value === "true" ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-medium">{sec.label}</span>
                  </div>
                  <Switch checked={sec.setting_value === "true"} onCheckedChange={() => toggleSection(sec.setting_key)} />
                </div>
              ))}
              <Button onClick={saveSections} disabled={saving}>
                <Save className="w-4 h-4 ml-2" />{saving ? "جاري الحفظ..." : "حفظ إعدادات الأقسام"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Custom Settings Tab ─── */}
        <TabsContent value="custom">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>إعدادات مخصصة</CardTitle>
              <Button size="sm" onClick={() => setAddDialog(true)}><Plus className="w-4 h-4 ml-2" />إضافة</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المفتاح</TableHead>
                    <TableHead>القيمة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customSettings.map((cs) => (
                    <TableRow key={cs.id}>
                      <TableCell className="font-mono text-xs" dir="ltr">{cs.setting_key}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{cs.setting_value}</TableCell>
                      <TableCell>{cs.setting_type}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => deleteCustomSetting(cs.id!)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {customSettings.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">لا توجد إعدادات مخصصة</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Setting Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إضافة إعداد جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المفتاح</Label>
              <Input value={newSetting.key} onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })} dir="ltr" placeholder="custom_key" />
            </div>
            <div className="space-y-2">
              <Label>القيمة</Label>
              <Textarea value={newSetting.value} onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Input value={newSetting.type} onChange={(e) => setNewSetting({ ...newSetting, type: e.target.value })} dir="ltr" placeholder="text, url, boolean..." />
            </div>
            <Button onClick={addCustomSetting}>إضافة</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
