import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Key, Plus, Pencil, Trash2, Search } from "lucide-react";

interface ApiKey {
  id: string;
  service: string;
  key_name: string;
  key_value_masked: string; // Now using masked value from safe view
  provider_url: string | null;
  is_active: boolean;
}

const emptyForm = { service: "", key_name: "", key_value: "", provider_url: "", is_active: true };

export default function AdminApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ApiKey | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchKeys = async () => {
    // Use safe view that masks key_value
    const { data, error } = await supabase.from("api_keys_safe").select("*").order("service");
    if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
    else setKeys((data as ApiKey[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (k: ApiKey) => {
    setEditing(k);
    setForm({
      service: k.service, key_name: k.key_name, key_value: "", // Don't pre-fill - require re-entry for security
      provider_url: k.provider_url || "", is_active: k.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    // For new keys, key_value is required. For edits, only update if provided.
    if (!form.key_name) {
      toast({ title: "يرجى ملء اسم المفتاح", variant: "destructive" });
      return;
    }
    if (!editing && !form.key_value) {
      toast({ title: "يرجى إدخال قيمة المفتاح", variant: "destructive" });
      return;
    }
    setSaving(true);
    
    const payload: Record<string, unknown> = { 
      service: form.service || form.key_name,
      key_name: form.key_name,
      provider_url: form.provider_url || null,
      is_active: form.is_active,
    };
    
    // Only include key_value if provided (for updates, it's optional)
    if (form.key_value) {
      payload.key_value = form.key_value;
    }

    if (editing) {
      const { error } = await supabase.from("api_keys").update(payload as { key_name: string; key_value?: string; service: string }).eq("id", editing.id);
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
      else toast({ title: "تم تحديث المفتاح" });
    } else {
      const { error } = await supabase.from("api_keys").insert(payload as { key_name: string; key_value: string; service: string });
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
      else toast({ title: "تم إضافة المفتاح" });
    }
    setSaving(false);
    setShowForm(false);
    fetchKeys();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد حذف هذا المفتاح؟")) return;
    await supabase.from("api_keys").delete().eq("id", id);
    toast({ title: "تم حذف المفتاح" });
    fetchKeys();
  };

  const filtered = keys.filter((k) =>
    k.service.toLowerCase().includes(search.toLowerCase()) ||
    k.key_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مفاتيح API والمدفوعات</h1>
          <p className="text-muted-foreground">إدارة مفاتيح الربط مع Amadeus وGoogle وMoyasar وغير ذلك.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث داخل القائمة" className="pr-9 w-48" />
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4 ml-2" />إضافة</Button>
        </div>
      </div>

      {/* Inline Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم المفتاح *</Label>
                <Input value={form.key_name} onChange={(e) => setForm({ ...form, key_name: e.target.value })} placeholder="amadeus, stripe..." />
              </div>
              <div className="space-y-2">
                <Label>المزود</Label>
                <Input value={form.provider_url} onChange={(e) => setForm({ ...form, provider_url: e.target.value })} dir="ltr" placeholder="https://api.example.com/..." />
              </div>
              <div className="space-y-2">
                <Label>قيمة المفتاح *</Label>
                <Input value={form.key_value} onChange={(e) => setForm({ ...form, key_value: e.target.value })} dir="ltr" type="password" />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={form.is_active ? "active" : "disabled"} onValueChange={(v) => setForm({ ...form, is_active: v === "active" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">مفعّل</SelectItem>
                    <SelectItem value="disabled">معطّل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "جاري الحفظ..." : editing ? "تحديث" : "إضافة"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keys list */}
      {loading ? (
        <p className="text-muted-foreground">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-card border border-border/50 text-center">
          <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد مفاتيح APIs</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((k) => (
            <Card key={k.id}>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">اسم المفتاح</p>
                    <p className="font-bold text-foreground">{k.key_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">المزود</p>
                    <p className="text-sm text-foreground truncate" dir="ltr">{k.provider_url || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">قيمة المفتاح</p>
                    <p className="text-sm font-mono text-foreground" dir="ltr">{k.key_value_masked}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">الحالة</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${k.is_active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {k.is_active ? "مفعّل" : "معطّل"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 justify-end">
                  <Button variant="outline" size="sm" onClick={() => openEdit(k)}>
                    <Pencil className="w-4 h-4 ml-1" />تعديل
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(k.id)}>
                    <Trash2 className="w-4 h-4 ml-1" />حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
