import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/ui/ImageUpload";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Sparkles } from "lucide-react";

interface Activity {
  id: string;
  name: string;
  city: string;
  category: string;
  price: number;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = {
  name: "", city: "", category: "", price: 0, image_url: "",
  description: "", is_active: true, sort_order: 0,
};

export default function AdminActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("activities").select("*").order("sort_order");
    setActivities((data as Activity[]) || []);
    setLoading(false);
  };

  const openNew = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (a: Activity) => {
    setEditing(a);
    setForm({
      name: a.name, city: a.city, category: a.category, price: Number(a.price),
      image_url: a.image_url || "", description: a.description || "",
      is_active: a.is_active, sort_order: a.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.city) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...form, price: Number(form.price), sort_order: Number(form.sort_order) };

    if (editing) {
      const { error } = await supabase.from("activities").update(payload).eq("id", editing.id);
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
      else toast({ title: "تم تحديث النشاط" });
    } else {
      const { error } = await supabase.from("activities").insert(payload);
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
      else toast({ title: "تم إضافة النشاط" });
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد حذف هذا النشاط؟")) return;
    await supabase.from("activities").delete().eq("id", id);
    toast({ title: "تم حذف النشاط" });
    load();
  };

  const filtered = activities.filter((a) =>
    a.name.includes(search) || a.city.includes(search) || a.category.includes(search)
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة النشاطات</h1>
          <p className="text-muted-foreground">إضافة مسابقات ومهرجانات وأنشطة متنوعة</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث داخل القائمة"
              className="pr-9 w-48"
            />
          </div>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 ml-2" />إضافة
          </Button>
        </div>
      </div>

      {/* Form at top when editing/adding */}
      {dialogOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "تعديل النشاط" : "إضافة نشاط جديد"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم النشاط *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>المدينة *</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="مهرجانات، مغامرات..." />
              </div>
              <div className="space-y-2">
                <Label>السعر</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} dir="ltr" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <ImageUpload
                  label="الصورة"
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                  folder="activities"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>الوصف</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>نشط</Label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "جاري الحفظ..." : editing ? "+ تحديث" : "+ إضافة"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activities Grid */}
      {loading ? (
        <p className="text-muted-foreground text-center py-12">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد نشاطات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-foreground">{a.name}</h3>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>اسم النشاط: {a.name}</p>
                  <p>المدينة: {a.city}</p>
                  <p>التصنيف: {a.category}</p>
                  <p>السعر: {Number(a.price).toLocaleString()}</p>
                  {a.image_url && <p className="truncate">الصورة: {a.image_url}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
