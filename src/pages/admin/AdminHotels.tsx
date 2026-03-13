import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/ui/ImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Hotel, Star } from "lucide-react";

interface HotelItem {
  id: string;
  name: string;
  city: string;
  address: string | null;
  stars: number;
  price_per_night: number;
  currency: string;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = {
  name: "", city: "", address: "", stars: 3, price_per_night: 0,
  currency: "SAR", image_url: "", description: "",
  is_active: true, sort_order: 0,
};

export default function AdminHotels() {
  const [items, setItems] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HotelItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("hotels").select("*").order("sort_order");
    setItems((data as HotelItem[]) || []);
    setLoading(false);
  };

  const openNew = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (item: HotelItem) => {
    setEditing(item);
    setForm({
      name: item.name, city: item.city, address: item.address || "",
      stars: item.stars, price_per_night: Number(item.price_per_night),
      currency: item.currency, image_url: item.image_url || "",
      description: item.description || "", is_active: item.is_active, sort_order: item.sort_order,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.city) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...form, price_per_night: Number(form.price_per_night), stars: Number(form.stars), sort_order: Number(form.sort_order) };

    if (editing) {
      const { error } = await supabase.from("hotels").update(payload).eq("id", editing.id);
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
      else toast({ title: "تم تحديث الفندق" });
    } else {
      const { error } = await supabase.from("hotels").insert(payload);
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
      else toast({ title: "تم إضافة الفندق" });
    }
    setSaving(false);
    setFormOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد حذف هذا الفندق؟")) return;
    await supabase.from("hotels").delete().eq("id", id);
    toast({ title: "تم حذف الفندق" });
    load();
  };

  const filtered = items.filter((i) => i.name.includes(search) || i.city.includes(search));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الفنادق</h1>
          <p className="text-muted-foreground">إضافة وتعديل الفنادق</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="pr-9 w-48" />
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4 ml-2" />إضافة فندق</Button>
        </div>
      </div>

      {formOpen && (
        <Card>
          <CardHeader><CardTitle>{editing ? "تعديل الفندق" : "إضافة فندق جديد"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>اسم الفندق *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>المدينة *</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>العنوان</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="space-y-2"><Label>النجوم</Label><Input type="number" min={1} max={5} value={form.stars} onChange={(e) => setForm({ ...form, stars: Number(e.target.value) })} dir="ltr" /></div>
              <div className="space-y-2"><Label>السعر لليلة</Label><Input type="number" value={form.price_per_night} onChange={(e) => setForm({ ...form, price_per_night: Number(e.target.value) })} dir="ltr" /></div>
              <div className="space-y-2"><Label>العملة</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2 md:col-span-2">
                <ImageUpload label="الصورة" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="hotels" />
              </div>
              <div className="space-y-2 md:col-span-2"><Label>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>نشط</Label></div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleSave} disabled={saving}>{saving ? "جاري الحفظ..." : editing ? "تحديث" : "إضافة"}</Button>
              <Button variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground text-center py-12">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12"><Hotel className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" /><p className="text-muted-foreground">لا توجد فنادق</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {item.image_url && <img src={item.image_url} alt={item.name} className="w-16 h-12 rounded-lg object-cover shrink-0" />}
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.city} | {"⭐".repeat(item.stars)} | {Number(item.price_per_night).toLocaleString()} {item.currency}/ليلة
                    </p>
                    <span className={`text-xs ${item.is_active ? "text-green-500" : "text-yellow-500"}`}>{item.is_active ? "نشط" : "غير نشط"}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
