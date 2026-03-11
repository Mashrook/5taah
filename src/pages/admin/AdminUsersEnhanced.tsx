import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Phone, Calendar, Shield, Search, RefreshCw, ChevronDown, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLES = [
  { value: "admin", label: "مسؤول", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  { value: "super_admin", label: "سوبر مسؤول", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { value: "editor", label: "محرر", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { value: "support", label: "دعم", color: "bg-green-500/10 text-green-400 border-green-500/20" },
];

const API_ROLES = [
  { value: "manager", label: "مدير", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { value: "agent", label: "وكيل", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  { value: "customer", label: "عميل", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
];

const ALL_ROLES = [...ROLES, ...API_ROLES];

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
  id: string;
}

export default function AdminUsersEnhanced() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);
    if (profilesRes.error) toast({ title: "خطأ", description: profilesRes.error.message, variant: "destructive" });
    setProfiles((profilesRes.data || []) as Profile[]);
    setUserRoles((rolesRes.data || []) as UserRole[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getUserRoles = (userId: string) =>
    userRoles.filter((r) => r.user_id === userId).map((r) => r.role);

  const toggleRole = async (userId: string, role: string) => {
    setSavingRole(`${userId}-${role}`);
    const existing = userRoles.find((r) => r.user_id === userId && r.role === role);
    if (existing) {
      const { error } = await supabase.from("user_roles").delete().eq("id", existing.id);
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
      else {
        setUserRoles((p) => p.filter((r) => r.id !== existing.id));
        toast({ title: `تم إزالة دور ${role}` });
      }
    } else {
      const { data, error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as string })
        .select()
        .single();
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
      else {
        setUserRoles((p) => [...p, data as UserRole]);
        toast({ title: `تم إضافة دور ${role}` });
      }
    }
    setSavingRole(null);
  };

  const filtered = profiles.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(s) ||
      p.user_id.toLowerCase().includes(s) ||
      p.phone?.includes(s)
    );
  });

  const getRoleStyle = (role: string) =>
    ALL_ROLES.find((r) => r.value === role)?.color || "bg-muted text-muted-foreground border-border";

  const getRoleLabel = (role: string) =>
    ALL_ROLES.find((r) => r.value === role)?.label || role;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" /> إدارة المستخدمين والأدوار
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{profiles.length} مستخدم مسجل</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو رقم الجوال..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 bg-muted/30"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-card border border-border/50 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا يوجد مستخدمين مطابقين</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const roles = getUserRoles(p.user_id);
            const isExpanded = expandedId === p.id;

            return (
              <div key={p.id} className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  className="w-full flex items-center gap-4 p-5 text-right hover:bg-muted/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <Users className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="font-bold text-foreground">{p.full_name || "بدون اسم"}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {p.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" /> {p.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {roles.length === 0 ? (
                      <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">لا أدوار</span>
                    ) : (
                      roles.slice(0, 2).map((r) => (
                        <span key={r} className={`text-xs px-2 py-1 rounded-full border ${getRoleStyle(r)}`}>
                          {getRoleLabel(r)}
                        </span>
                      ))
                    )}
                    {roles.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{roles.length - 2}</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-border/30 pt-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">معرّف المستخدم</p>
                      <p className="text-xs font-mono bg-muted/30 px-3 py-1.5 rounded-lg" dir="ltr">{p.user_id}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> أدوار النظام
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ROLES.map((role) => {
                          const hasRole = roles.includes(role.value);
                          const isSaving = savingRole === `${p.user_id}-${role.value}`;
                          return (
                            <button
                              key={role.value}
                              onClick={() => toggleRole(p.user_id, role.value)}
                              disabled={isSaving}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                hasRole ? role.color : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
                              }`}
                            >
                              {hasRole ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                              {role.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> أدوار الـ API
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {API_ROLES.map((role) => {
                          const hasRole = roles.includes(role.value);
                          const isSaving = savingRole === `${p.user_id}-${role.value}`;
                          return (
                            <button
                              key={role.value}
                              onClick={() => toggleRole(p.user_id, role.value)}
                              disabled={isSaving}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                hasRole ? role.color : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
                              }`}
                            >
                              {hasRole ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                              {role.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
