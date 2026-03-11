import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/ui/ImageUpload";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Program = Tables<"study_programs">;

const emptyProgram = {
  title: "", city: "", country: "", country_code: "", description: "",
  image_url: "", currency: "SAR", duration: "", level: "lang",
  price: 0, accommodation_type: "", university_name: "", tag: "",
  is_active: true, sort_order: 0,
};

export default function AdminStudyPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [form, setForm] = useState(emptyProgram);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("study_programs").select("*").order("sort_order");
    setPrograms(data || []);
    setLoading(false);
  };

  const openNew = () => { setEditing(null); setForm(emptyProgram); setDialogOpen(true); };
  const openEdit = (p: Program) => {
    setEditing(p);
    setForm({
      title: p.title, city: p.city, country: p.country, country_code: p.country_code,
      description: p.description || "", image_url: p.image_url || "", currency: p.currency,
      duration: p.duration, level: p.level, price: Number(p.price),
      accommodation_type: p.accommodation_type || "", university_name: p.university_name || "",
      tag: p.tag || "", is_active: p.is_active, sort_order: p.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.city || !form.country || !form.duration) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...form, price: Number(form.price), sort_order: Number(form.sort_order) };

    if (editing) {
      const { error } = await supabase.from("study_programs").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "خطأ", description: error.message, variant: "destructive" }); }
      else { toast({ title: "تم تحديث البرنامج" }); }
    } else {
      const { error } = await supabase.from("study_programs").insert(payload);
      if (error) { toast({ title: "خطأ", description: error.message, variant: "destructive" }); }
      else { toast({ title: "تم إضافة البرنامج" }); }
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد حذف هذا البرنامج؟")) return;
    await supabase.from("study_programs").delete().eq("id", id);
    toast({ title: "تم حذف البرنامج" });
    load();
  };

  const toggleActive = async (p: Program) => {
    await supabase.from("study_programs").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  };

  const levelLabels: Record<string, string> = { lang: "لغة", bachelor: "بكالوريوس", master: "ماجستير", diploma: "دبلوم" };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة البرامج الدراسية</h1>
          <p className="text-muted-foreground">إضافة وتعديل وحذف البرامج التعليمية</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 ml-2" />إضافة برنامج</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5" />البرامج ({programs.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground">جاري التحميل...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الدولة</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>المستوى</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{p.country}</TableCell>
                    <TableCell>{p.city}</TableCell>
                    <TableCell>{levelLabels[p.level] || p.level}</TableCell>
                    <TableCell>{Number(p.price).toLocaleString()} {p.currency}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(p)}>
                        {p.is_active ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "تعديل البرنامج" : "إضافة برنامج جديد"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>العنوان *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الدولة *</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>المدينة *</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>رمز الدولة</Label>
              <Input value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })} placeholder="GB, MY, AU..." dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>المدة *</Label>
              <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="6 أشهر" />
            </div>
            <div className="space-y-2">
              <Label>المستوى</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lang">لغة</SelectItem>
                  <SelectItem value="diploma">دبلوم</SelectItem>
                  <SelectItem value="bachelor">بكالوريوس</SelectItem>
                  <SelectItem value="master">ماجستير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>السعر</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>العملة</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>اسم الجامعة</Label>
              <Input value={form.university_name} onChange={(e) => setForm({ ...form, university_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>نوع السكن</Label>
              <Input value={form.accommodation_type} onChange={(e) => setForm({ ...form, accommodation_type: e.target.value })} placeholder="سكن طلابي، شقة..." />
            </div>
            <div className="space-y-2">
              <ImageUpload
                label="صورة البرنامج"
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
                folder="study-programs"
              />
            </div>
            <div className="space-y-2">
              <Label>وسم (Tag)</Label>
              <Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="الأكثر طلباً" />
            </div>
            <div className="space-y-2">
              <Label>ترتيب العرض</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} dir="ltr" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>نشط</Label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>الوصف</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "جاري الحفظ..." : editing ? "تحديث" : "إضافة"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
