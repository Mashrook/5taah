import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CreditCard, ShieldCheck, Key } from "lucide-react";

export default function AdminPaymentSettings() {
  const [provider, setProvider] = useState("none");
  const [moyasarKey, setMoyasarKey] = useState("");
  const [stripeKey, setStripeKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from("site_settings").select("*").is("tenant_id", null);
    const all = data || [];
    const prov = all.find((s) => s.setting_key === "payment_provider");
    if (prov?.setting_value) setProvider(prov.setting_value);

    // Load from api_keys
    const { data: keys } = await supabase.from("api_keys").select("*").in("service", ["moyasar", "stripe"]);
    const mk = keys?.find((k) => k.service === "moyasar" && k.key_name === "publishable_key");
    const sk = keys?.find((k) => k.service === "stripe" && k.key_name === "publishable_key");
    if (mk) setMoyasarKey(mk.key_value);
    if (sk) setStripeKey(sk.key_value);
  };

  const upsertSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from("site_settings").select("id").eq("setting_key", key).is("tenant_id", null).maybeSingle();
    if (existing) await supabase.from("site_settings").update({ setting_value: value }).eq("id", existing.id);
    else await supabase.from("site_settings").insert({ setting_key: key, setting_value: value, setting_type: "text" });
  };

  const upsertApiKey = async (service: string, keyName: string, keyValue: string) => {
    if (!keyValue) return;
    const { data: existing } = await supabase.from("api_keys").select("id").eq("service", service).eq("key_name", keyName).maybeSingle();
    if (existing) await supabase.from("api_keys").update({ key_value: keyValue }).eq("id", existing.id);
    else await supabase.from("api_keys").insert({ service, key_name: keyName, key_value: keyValue, is_active: true });
  };

  const handleSave = async () => {
    setSaving(true);
    await upsertSetting("payment_provider", provider);
    if (moyasarKey) await upsertApiKey("moyasar", "publishable_key", moyasarKey);
    if (stripeKey) await upsertApiKey("stripe", "publishable_key", stripeKey);
    toast({ title: "تم حفظ إعدادات الدفع" });
    setSaving(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المدفوعات</h1>
          <p className="text-muted-foreground">إعدادات الدفع المباشر تُدار عبر مزود خارجي، تأكد من تهيئة المفاتيح العامة وعدم تخزين المفاتيح السرية في الواجهة.</p>
        </div>
      </div>

      {/* Payment Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            لوحة المدفوعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
              <p className="text-sm text-muted-foreground mb-1">المزود الحالي</p>
              <p className="font-bold text-foreground">
                {provider === "moyasar" ? "Moyasar" : provider === "stripe" ? "Stripe" : "غير مهيأ"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
              <p className="text-sm text-muted-foreground mb-1">مفتاح Stripe العام</p>
              <p className="font-bold text-foreground">{stripeKey ? "موجود" : "غير موجود"}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
              <p className="text-sm text-muted-foreground mb-1">مفتاح Moyasar العام</p>
              <p className="font-bold text-foreground">{moyasarKey ? "موجود" : "غير موجود"}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>المزود</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">غير مهيأ</SelectItem>
                  <SelectItem value="moyasar">Moyasar</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(provider === "moyasar" || moyasarKey) && (
              <div className="space-y-2">
                <Label>مفتاح Moyasar العام (Publishable Key)</Label>
                <Input value={moyasarKey} onChange={(e) => setMoyasarKey(e.target.value)} dir="ltr" placeholder="pk_live_..." />
              </div>
            )}

            {(provider === "stripe" || stripeKey) && (
              <div className="space-y-2">
                <Label>مفتاح Stripe العام (Publishable Key)</Label>
                <Input value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} dir="ltr" placeholder="pk_live_..." />
              </div>
            )}

            <Button onClick={handleSave} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security & Keys Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              جاهزية الأمان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• تأكد من تفعيل 3D Secure لدى مزود الدفع.</p>
            <p>• استخدم Webhooks للتحقق من حالة الدفع من الخادم.</p>
            <p>• لا تحفظ بيانات البطاقة في المتصفح أو قاعدة البيانات.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="w-5 h-5 text-primary" />
              المفاتيح والسرية
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>المفاتيح السرية يجب أن تبقى في الخادم فقط. يمكنك إدارة المفاتيح العامة من ملف البيئة وتحديثها بدون إعادة نشر قاعدة البيانات.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
