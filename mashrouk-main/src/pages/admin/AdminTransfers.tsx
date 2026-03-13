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
import { Plus, Pencil, Trash2, Search, ArrowRightLeft } from "lucide-react";

interface TransferItem {
  id: string;
  title: string;
  origin: string;
  destination: string;
  vehicle_type: string;
  price: number;
  currency: string;
  image_url: string | null;
  description: string | null;
  max_passengers: number;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = {
  title: "", origin: "", destination: "", vehicle_type: "sedan",
  price: 0, currency: "SAR", image_url: "", description: "",
  max_passengers: 4, is_active: true, sort_order: 0,
};

export default function AdminTransfers() {
  const [items, setItems] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransferItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("transfers").select("*").order("sort_order");
    setItems((data as TransferItem[]) || []);
    setLoading(false);
  };

  const openNew = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (item: TransferItem) => {
    setEditing(item);
    setForm({
      title: item.title, origin: item.origin, destination: item.destination,
      vehicle_type: item.vehicle_type, price: Number(item.price), currency: item.currency,
      image_url: item.image_url || "", description: item.description || "",
      max_passengers: item.max_passengers, is_active: item.is_active, sort_order: item.sort_order,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.origin || !form.destination) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...form, price: Number(form.price), max_passengers: Number(form.max_passengers), sort_order: Number(form.sort_order) };

    if (editing) {
      const { error } = await supabase.from("transfers").update(payload).eq("id", editing.id);
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
      else toast({ title: "تم تحديث خدمة النقل" });
    } else {
      const { error } = await supabase.from("transfers").insert(payload);
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
      else toast({ title: "تم إضافة خدمة النقل" });
    }
    setSaving(false);
    setFormOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد حذف خدمة النقل هذه؟")) return;
    await supabase.from("transfers").delete().eq("id", id);
    toast({ title: "تم حذف خدمة النقل" });
    load();
  };

  const filtered = items.filter((i) => i.title.includes(search) || i.origin.includes(search) || i.destination.includes(search));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة النقل والمواصلات</h1>
          <p className="text-muted-foreground">إضافة وتعديل خدمات النقل</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="pr-9 w-48" />
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4 ml-2" />إضافة خدمة</Button>
        </div>
      </div>

      {formOpen && (
        <Card>
          <CardHeader><CardTitle>{editing ? "تعديل خدمة النقل" : "إضافة خدمة نقل جديدة"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>العنوان *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>نوع المركبة</Label><Input value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} placeholder="sedan, van, bus..." /></div>
              <div className="space-y-2"><Label>المغادرة من *</Label><Input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} /></div>
              <div className="space-y-2"><Label>الوصول إلى *</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
              <div className="space-y-2"><Label>السعر</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} dir="ltr" /></div>
              <div className="space-y-2"><Label>عدد الركاب</Label><Input type="number" value={form.max_passengers} onChange={(e) => setForm({ ...form, max_passengers: Number(e.target.value) })} dir="ltr" /></div>
              <div className="space-y-2 md:col-span-2">
                <ImageUpload label="الصورة" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="transfers" />
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
        <div className="text-center py-12"><ArrowRightLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" /><p className="text-muted-foreground">لا توجد خدمات نقل</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {item.image_url && <img src={item.image_url} alt={item.title} className="w-16 h-12 rounded-lg object-cover shrink-0" />}
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.origin} → {item.destination} | {item.vehicle_type} | {Number(item.price).toLocaleString()} {item.currency}</p>
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
