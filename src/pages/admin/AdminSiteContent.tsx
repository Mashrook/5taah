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
import { Image, LayoutGrid, Plus, Trash2, Save, Eye, EyeOff, Upload } from "lucide-react";

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
  { key: "img_hero", label: "صورة البانر الرئيسي" },
  { key: "img_featured_offer", label: "صورة العرض المميز" },
  { key: "img_riyadh", label: "صورة الرياض" },
  { key: "img_jeddah", label: "صورة جدة" },
  { key: "img_medina", label: "صورة المدينة" },
  { key: "img_abha", label: "صورة أبها" },
  { key: "img_alula", label: "صورة العلا" },
  { key: "img_tabuk", label: "صورة تبوك" },
  { key: "img_dubai", label: "صورة دبي" },
  { key: "img_diriyah", label: "صورة الدرعية" },
];

export default function AdminSiteContent() {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customSettings, setCustomSettings] = useState<SiteImage[]>([]);
  const [addDialog, setAddDialog] = useState(false);
  const [newSetting, setNewSetting] = useState({ key: "", value: "", type: "text", label: "" });
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images"><Image className="w-4 h-4 ml-2" />الصور</TabsTrigger>
          <TabsTrigger value="sections"><LayoutGrid className="w-4 h-4 ml-2" />الأقسام</TabsTrigger>
          <TabsTrigger value="custom">إعدادات أخرى</TabsTrigger>
        </TabsList>

        {/* ─── Images Tab ─── */}
        <TabsContent value="images">
          <Card>
            <CardHeader><CardTitle>صور الموقع</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {images.map((img) => {
                const label = IMAGE_KEYS.find((k) => k.key === img.setting_key)?.label || img.setting_key;
                return (
                  <div key={img.setting_key} className="space-y-2 p-3 rounded-lg border border-border">
                    <Label className="font-medium">{label}</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={img.setting_value || ""}
                        onChange={(e) => updateImageUrl(img.setting_key, e.target.value)}
                        placeholder="https://..."
                        dir="ltr"
                        className="flex-1"
                      />
                      <input
                        ref={(el) => { fileInputRefs.current[img.setting_key] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
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
                        <Upload className="w-4 h-4 ml-1" />
                        {uploadingKey === img.setting_key ? "..." : "رفع"}
                      </Button>
                    </div>
                    {img.setting_value && (
                      <img src={img.setting_value} alt={label} className="w-full max-w-xs h-24 rounded-lg object-cover border border-border" />
                    )}
                  </div>
                );
              })}
              <Button onClick={saveImages} disabled={saving}>
                <Save className="w-4 h-4 ml-2" />{saving ? "جاري الحفظ..." : "حفظ جميع الصور"}
              </Button>
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
