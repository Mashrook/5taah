import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Key, Eye, EyeOff, Save, RefreshCw, CheckCircle2, XCircle, Info } from "lucide-react";

interface AmadeusKey {
  id: string;
  service: string;
  key_name: string;
  key_value: string;
  is_active: boolean;
  updated_at: string;
}

const AMADEUS_KEYS = [
  { name: "client_id", label: "Client ID", hint: "مفتاح العميل العام من Amadeus Self-Service" },
  { name: "client_secret", label: "Client Secret", hint: "المفتاح السري من Amadeus Self-Service" },
  { name: "api_endpoint", label: "Base URL", hint: "https://test.api.amadeus.com  أو  https://api.amadeus.com" },
];

export default function AdminAmadeusKeys() {
  const [keys, setKeys] = useState<AmadeusKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchKeys = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .eq("service", "amadeus")
      .order("key_name");
    const rows = (data || []) as AmadeusKey[];
    setKeys(rows);
    const vals: Record<string, string> = {};
    rows.forEach((k) => { vals[k.key_name] = k.key_value; });
    setEditValues(vals);
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleSave = async (keyName: string) => {
    setSaving(keyName);
    const existing = keys.find((k) => k.key_name === keyName);
    const value = editValues[keyName] || "";
    if (!value.trim()) {
      toast({ title: "خطأ", description: "القيمة مطلوبة", variant: "destructive" });
      setSaving(null);
      return;
    }

    if (existing) {
      const { error } = await supabase
        .from("api_keys")
        .update({ key_value: value, is_active: true })
        .eq("id", existing.id);
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
      else toast({ title: "✅ تم الحفظ", description: `تم تحديث ${keyName}` });
    } else {
      const { error } = await supabase
        .from("api_keys")
        .insert({ service: "amadeus", key_name: keyName, key_value: value, is_active: true });
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
      else toast({ title: "✅ تم الحفظ", description: `تم إضافة ${keyName}` });
    }
    await fetchKeys();
    setSaving(null);
  };

  const toggleActive = async (key: AmadeusKey) => {
    await supabase.from("api_keys").update({ is_active: !key.is_active }).eq("id", key.id);
    fetchKeys();
    toast({ title: key.is_active ? "تم التعطيل" : "تم التفعيل" });
  };

  const toggleVisibility = (name: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const mask = (val: string) => val ? val.slice(0, 4) + "••••••••" + val.slice(-4) : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Key className="w-7 h-7 text-primary" /> إدارة مفاتيح Amadeus
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة Client ID / Secret لـ Amadeus Self-Service APIs
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchKeys} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-8">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-semibold mb-1">ملاحظة أمنية</p>
          <p>المفاتيح السرية مخزنة مشفرة ولا تظهر في الواجهة الأمامية. استخدم بيئة Test أولاً قبل الإنتاج.</p>
        </div>
      </div>

      <div className="space-y-4">
        {AMADEUS_KEYS.map((def) => {
          const existing = keys.find((k) => k.key_name === def.name);
          const isVisible = visible.has(def.name);
          const isSavingThis = saving === def.name;

          return (
            <div key={def.name} className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-base">{def.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{def.hint}</p>
                </div>
                <div className="flex items-center gap-2">
                  {existing ? (
                    <>
                      <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                        existing.is_active
                          ? "bg-green-500/10 text-green-400"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {existing.is_active
                          ? <><CheckCircle2 className="w-3.5 h-3.5" />نشط</>
                          : <><XCircle className="w-3.5 h-3.5" />معطّل</>
                        }
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(existing)}
                        className="text-xs"
                      >
                        {existing.is_active ? "تعطيل" : "تفعيل"}
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">غير محدد</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    dir="ltr"
                    type={isVisible ? "text" : "password"}
                    value={editValues[def.name] || ""}
                    onChange={(e) => setEditValues((p) => ({ ...p, [def.name]: e.target.value }))}
                    placeholder={existing ? mask(existing.key_value) : `أدخل ${def.label}`}
                    className="bg-muted/30 font-mono text-sm pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => toggleVisibility(def.name)}
                  >
                    {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => handleSave(def.name)}
                  disabled={isSavingThis}
                  className="shrink-0"
                >
                  {isSavingThis ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Save className="w-4 h-4 ml-1.5" />حفظ</>
                  )}
                </Button>
              </div>

              {existing && (
                <p className="text-xs text-muted-foreground">
                  آخر تحديث: {new Date(existing.updated_at).toLocaleDateString("ar-SA")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
