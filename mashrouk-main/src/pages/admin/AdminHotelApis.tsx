import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Hotel, RefreshCw, Info, CheckCircle2, XCircle, Users, ShieldCheck } from "lucide-react";

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
  metadata: any;
}

export default function AdminHotelApis() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [flags, setFlags] = useState<ApiFlag[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("tenants").select("id, name, slug").order("name").then(({ data }) => {
      setTenants(data || []);
      if (data && data.length > 0) setSelectedTenant(data[0].id);
    });
  }, []);

  const fetchFlags = async (tenantId: string) => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase
      .from("feature_flags")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("flag_key", HOTEL_APIS.map((a) => a.key));
    setFlags((data || []) as ApiFlag[]);

    // parse role permissions from metadata
    const rp: Record<string, string[]> = {};
    (data || []).forEach((f: any) => {
      rp[f.flag_key] = f.metadata?.allowed_roles || [];
    });
    setRolePerms(rp);
    setLoading(false);
  };

  useEffect(() => { fetchFlags(selectedTenant); }, [selectedTenant]);

  const getFlag = (key: string) => flags.find((f) => f.flag_key === key);

  const toggleApi = async (apiKey: string, currentEnabled: boolean) => {
    if (!selectedTenant) return;
    const existing = getFlag(apiKey);
    if (existing) {
      await supabase.from("feature_flags")
        .update({ is_enabled: !currentEnabled })
        .eq("id", existing.id);
    } else {
      await supabase.from("feature_flags").insert({
        tenant_id: selectedTenant,
        flag_key: apiKey,
        is_enabled: true,
        metadata: { allowed_roles: ["admin", "manager", "agent", "customer"] },
      });
    }
    fetchFlags(selectedTenant);
    toast({ title: !currentEnabled ? "تم تفعيل الـ API" : "تم تعطيل الـ API" });
  };

  const toggleRolePermission = async (apiKey: string, role: string) => {
    const existing = getFlag(apiKey);
    const currentRoles = rolePerms[apiKey] || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];

    if (existing) {
      await supabase.from("feature_flags").update({
        metadata: { ...(existing.metadata || {}), allowed_roles: newRoles },
      }).eq("id", existing.id);
    } else {
      await supabase.from("feature_flags").insert({
        tenant_id: selectedTenant,
        flag_key: apiKey,
        is_enabled: false,
        metadata: { allowed_roles: newRoles },
      });
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
          <p className="text-muted-foreground text-sm mt-1">
            تفعيل / تعطيل Hotel APIs وتحديد الأدوار المسموح لها
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchFlags(selectedTenant)} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      {/* Tenant selector */}
      <div className="flex items-center gap-4 mb-8">
        <label className="text-sm font-medium text-muted-foreground">المستأجر:</label>
        <select
          className="flex h-10 max-w-xs rounded-xl border border-input bg-background px-3 py-2 text-sm"
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
        >
          <option value="">اختر مستأجر...</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
          ))}
        </select>
      </div>

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
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">{api.labelAr}</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground" dir="ltr">
                        {api.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{api.desc}</p>
                    <p className="text-xs font-mono text-primary/70 mt-1" dir="ltr">{api.endpoint}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-full ${
                      enabled ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"
                    }`}>
                      {enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {enabled ? "مفعّل" : "معطّل"}
                    </span>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggleApi(api.key, enabled)}
                    />
                  </div>
                </div>

                {/* Role permissions */}
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
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            allowed
                              ? `${r.color} border-current`
                              : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
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
