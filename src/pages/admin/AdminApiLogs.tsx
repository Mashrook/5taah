import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ScrollText, RefreshCw, Search, Plane, Hotel, AlertTriangle, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, Filter,
} from "lucide-react";

interface ApiLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before: any;
  after: any;
  actor_admin_id: string;
  created_at: string;
}

const LOG_TYPES = [
  { value: "", label: "كل السجلات" },
  { value: "flight_search", label: "بحث رحلات" },
  { value: "flight_booking", label: "حجز رحلات" },
  { value: "hotel_search", label: "بحث فنادق" },
  { value: "hotel_booking", label: "حجز فنادق" },
  { value: "amadeus_error", label: "أخطاء Amadeus" },
  { value: "booking", label: "حجوزات عامة" },
];

const LOG_ACTIONS = [
  { value: "", label: "كل الإجراءات" },
  { value: "search", label: "بحث" },
  { value: "book", label: "حجز" },
  { value: "error", label: "خطأ" },
  { value: "cancel", label: "إلغاء" },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  flight_search: <Plane className="w-4 h-4 text-blue-400" />,
  flight_booking: <Plane className="w-4 h-4 text-green-400" />,
  hotel_search: <Hotel className="w-4 h-4 text-orange-400" />,
  hotel_booking: <Hotel className="w-4 h-4 text-green-400" />,
  amadeus_error: <AlertTriangle className="w-4 h-4 text-destructive" />,
};

const STATUS_STYLES: Record<string, string> = {
  success: "bg-green-500/10 text-green-400",
  error: "bg-destructive/10 text-destructive",
  pending: "bg-yellow-500/10 text-yellow-400",
};

export default function AdminApiLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (typeFilter) query = query.eq("entity_type", typeFilter);
      if (actionFilter) query = query.eq("action", actionFilter);

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data || []) as ApiLog[]);
    } catch {
      toast({ title: "خطأ", description: "تعذر تحميل السجلات", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [typeFilter, actionFilter, page]);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(s) ||
      l.entity_type?.toLowerCase().includes(s) ||
      l.entity_id?.toLowerCase().includes(s) ||
      JSON.stringify(l.after || {}).toLowerCase().includes(s)
    );
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("ar-SA") + " " + date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  };

  const getStatus = (log: ApiLog) => {
    const after = log.after || {};
    if (after.error || log.action?.includes("error")) return "error";
    if (after.status === "confirmed" || after.status === "success") return "success";
    return "pending";
  };

  // Stats
  const errors = logs.filter((l) => l.entity_type === "amadeus_error" || l.action?.includes("error")).length;
  const searches = logs.filter((l) => l.action === "search").length;
  const bookings = logs.filter((l) => l.action === "book").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ScrollText className="w-7 h-7 text-primary" /> سجلات APIs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            عمليات البحث والحجز والأخطاء القادمة من Amadeus
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-2xl font-bold text-blue-400">{searches}</p>
          <p className="text-xs text-blue-300 mt-1">عمليات بحث</p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-2xl font-bold text-green-400">{bookings}</p>
          <p className="text-xs text-green-300 mt-1">عمليات حجز</p>
        </div>
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
          <p className="text-2xl font-bold text-destructive">{errors}</p>
          <p className="text-xs text-destructive/70 mt-1">أخطاء</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في السجلات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 bg-muted/30"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className="px-4 py-2 rounded-xl bg-muted border border-border/50 text-foreground text-sm"
        >
          {LOG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
          className="px-4 py-2 rounded-xl bg-muted border border-border/50 text-foreground text-sm"
        >
          {LOG_ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p>لا توجد سجلات مطابقة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => {
            const status = getStatus(log);
            const isExpanded = expandedId === log.id;

            return (
              <div key={log.id} className="rounded-xl bg-card border border-border/50 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="w-full flex items-center gap-4 p-4 text-right hover:bg-muted/20 transition-colors"
                >
                  <div className="shrink-0">
                    {TYPE_ICONS[log.entity_type] || <ScrollText className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status] || "bg-muted text-muted-foreground"}`}>
                        {status === "success" ? "✓ نجاح" : status === "error" ? "✗ خطأ" : "○ قيد التنفيذ"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {log.action}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                        {log.entity_type}
                      </span>
                    </div>
                    {log.entity_id && (
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate" dir="ltr">
                        ID: {log.entity_id.slice(0, 20)}...
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDate(log.created_at)}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/30 space-y-3 pt-3">
                    {log.before && Object.keys(log.before).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 font-semibold">طلب (Request)</p>
                        <pre className="text-xs bg-muted/30 p-3 rounded-lg overflow-x-auto max-h-40 text-foreground" dir="ltr">
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.after && Object.keys(log.after).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 font-semibold">استجابة (Response)</p>
                        <pre className="text-xs bg-muted/30 p-3 rounded-lg overflow-x-auto max-h-40 text-foreground" dir="ltr">
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground" dir="ltr">Actor: {log.actor_admin_id}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          السابق
        </Button>
        <span className="text-sm text-muted-foreground">صفحة {page + 1}</span>
        <Button variant="outline" size="sm" disabled={filtered.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}>
          التالي
        </Button>
      </div>
    </div>
  );
}
