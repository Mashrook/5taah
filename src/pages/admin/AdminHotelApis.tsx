import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTenantStore } from "@/stores/tenantStore";
import { Hotel, RefreshCw, CheckCircle2, XCircle, Users, ShieldCheck, AlertTriangle } from "lucide-react";

const HOTEL_APIS = [
  {
    key: "hotel_list_api",
    label: "Hotel List API",
    labelAr: "قائمة الفنادق",
    desc: "البحث عن قائمة الفنادق المتاحة حسب المدينة",
    endpoint: "/v1/reference-data/locations/hotels/by-city",
  },
  {
    key: "hotel_search_api",
    label: "Hotel Search API",
    labelAr: "بحث الفنادق",
    desc: "البحث عن عروض الفنادق والأسعار المتاحة",
    endpoint: "/v3/shopping/hotel-offers",
  },
  {
    key: "hotel_booking_api",
    label: "Hotel Booking API",
    labelAr: "حجز الفنادق",
    desc: "إتمام حجوزات الفنادق عبر Amadeus",
    endpoint: "/v1/booking/hotel-orders",
  },
];

const ROLE_APIS = [
  { role: "admin", label: "المسؤول", color: "text-red-400 bg-red-500/10" },
  { role: "manager", label: "المدير", color: "text-orange-400 bg-orange-500/10" },
  { role: "agent", label: "الوكيل", color: "text-blue-400 bg-blue-500/10" },
  { role: "customer", label: "العميل", color: "text-green-400 bg-green-500/10" },
];

interface ApiFlag {
  id: string;
  flag_key: string;
  is_enabled: boolean;
  metadata: Record<string, unknown> | null;
}

export default function AdminHotelApis() {
  const [tenants, setTenants] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [flags, setFlags] = useState<ApiFlag[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const { tenant: currentTenant } = useTenantStore();
  const { toast } = useToast();

  const selectedTenantObj = useMemo(() => tenants.find((t) => t.id === selectedTenant), [tenants, selectedTenant]);

  const loadTenants = async () => {
    setLoadingTenants(true);
    const { data, error } = await supabase.from("tenants").select("id, name, slug").order("name");
    setLoadingTenants(false);

    if (error) {
      if (currentTenant?.id) {
        setTenants([{ id: currentTenant.id, name: currentTenant.name || "Tenant", slug: currentTenant.slug || "tenant" }]);
        setSelectedTenant(currentTenant.id);
        return;
      }
      toast({ title: "خطأ", description: "تعذر تحميل المستأجرين", variant: "destructive" });
      return;
    }

    const list = (data || []) as Array<{ id: string; name: string; slug: string }>;
    setTenants(list);

    if (list.length > 0) {
      const fallback = list.find((t) => t.id === currentTenant?.id) || list[0];
      setSelectedTenant((prev) => prev || fallback.id);
    }
  };

  const fetchFlags = async (tenantId: string) => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("feature_flags")
      .select("id, flag_key, is_enabled, metadata")
      .eq("tenant_id", tenantId)
      .in("flag_key", HOTEL_APIS.map((a) => a.key));
    setLoading(false);

    if (error) {
      setFlags([]);
      setRolePerms({});
      toast({ title: "خطأ", description: "تعذر تحميل إعدادات Hotel APIs", variant: "destructive" });
      return;
    }

    const parsed = (data || []) as ApiFlag[];
    setFlags(parsed);

    const perms: Record<string, string[]> = {};
    parsed.forEach((f) => {
      const metadata = (f.metadata || {}) as Record<string, unknown>;
      perms[f.flag_key] = Array.isArray(metadata.allowed_roles) ? (metadata.allowed_roles as string[]) : [];
    });
    setRolePerms(perms);
  };

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) fetchFlags(selectedTenant);
  }, [selectedTenant]);

  const getFlag = (key: string) => flags.find((f) => f.flag_key === key);

  const toggleApi = async (apiKey: string, currentEnabled: boolean) => {
    if (!selectedTenant) {
      toast({ title: "تنبيه", description: "اختر مستأجرًا أولًا", variant: "destructive" });
      return;
    }

    const existing = getFlag(apiKey);
    const payload = existing
      ? supabase.from("feature_flags").update({ is_enabled: !currentEnabled }).eq("id", existing.id)
      : supabase.from("feature_flags").insert({
          tenant_id: selectedTenant,
          flag_key: apiKey,
          is_enabled: true,
          metadata: { allowed_roles: ["admin", "manager", "agent", "customer"] },
        });

    const { error } = await payload;
    if (error) {
      toast({ title: "خطأ", description: error.message || "تعذر تحديث حالة الـ API", variant: "destructive" });
      return;
    }

    await fetchFlags(selectedTenant);
    toast({ title: !currentEnabled ? "تم تفعيل الـ API" : "تم تعطيل الـ API" });
  };

  const toggleRolePermission = async (apiKey: string, role: string) => {
    if (!selectedTenant) {
      toast({ title: "تنبيه", description: "اختر مستأجرًا أولًا", variant: "destructive" });
      return;
    }

    const existing = getFlag(apiKey);
    const currentRoles = rolePerms[apiKey] || [];
    const newRoles = currentRoles.includes(role) ? currentRoles.filter((r) => r !== role) : [...currentRoles, role];

    const { error } = existing
      ? await supabase
          .from("feature_flags")
          .update({ metadata: { ...(existing.metadata || {}), allowed_roles: newRoles } })
          .eq("id", existing.id)
      : await supabase.from("feature_flags").insert({
          tenant_id: selectedTenant,
          flag_key: apiKey,
          is_enabled: false,
          metadata: { allowed_roles: newRoles },
        });

    if (error) {
      toast({ title: "خطأ", description: error.message || "تعذر تحديث الصلاحيات", variant: "destructive" });
      return;
    }

    setRolePerms((p) => ({ ...p, [apiKey]: newRoles }));
    toast({ title: "تم تحديث الصلاحيات" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Hotel className="w-7 h-7 text-primary" /> إدارة Hotel APIs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">تفعيل / تعطيل Hotel APIs وتحديد الأدوار المسموح لها</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchFlags(selectedTenant)} disabled={loading || !selectedTenant}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <label className="text-sm font-medium text-muted-foreground">المستأجر:</label>
        <select className="flex h-10 max-w-xs rounded-xl border border-input bg-background px-3 py-2 text-sm" value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)} disabled={loadingTenants}>
          <option value="">{loadingTenants ? "جارٍ التحميل..." : "اختر مستأجر..."}</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.slug})
            </option>
          ))}
        </select>
      </div>

      {!selectedTenant && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          لا يمكن التفعيل قبل اختيار مستأجر.
        </div>
      )}

      {selectedTenantObj && (
        <div className="mb-4 text-sm text-muted-foreground">
          المستأجر الحالي: <span className="font-medium text-foreground">{selectedTenantObj.name}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {HOTEL_APIS.map((api) => {
            const flag = getFlag(api.key);
            const enabled = flag?.is_enabled ?? false;
            const allowedRoles = rolePerms[api.key] || [];

            return (
              <div key={api.key} className="p-6 rounded-2xl bg-card border border-border space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">{api.labelAr}</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground" dir="ltr">
                        {api.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{api.desc}</p>
                    <p className="text-xs font-mono text-primary/70 mt-1" dir="ltr">
                      {api.endpoint}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-full ${enabled ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
                      {enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {enabled ? "مفعّل" : "معطّل"}
                    </span>
                    <Switch checked={enabled} onCheckedChange={() => toggleApi(api.key, enabled)} disabled={!selectedTenant} />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">الأدوار المسموح لها</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_APIS.map((r) => {
                      const allowed = allowedRoles.includes(r.role);
                      return (
                        <button
                          key={r.role}
                          onClick={() => toggleRolePermission(api.key, r.role)}
                          disabled={!selectedTenant}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            allowed ? `${r.color} border-current` : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
                          }`}
                        >
                          <Users className="w-3 h-3" />
                          {r.label}
                          {allowed && <CheckCircle2 className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
