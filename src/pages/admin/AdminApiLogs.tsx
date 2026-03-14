import { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ScrollText,
  RefreshCw,
  Search,
  Plane,
  Hotel,
  Car,
  Map,
  ArrowRightLeft,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Timer,
} from "lucide-react";

type LogStatus = "success" | "error" | "pending";
type LogAction = "search" | "book" | "error";
type LogSource = "api_search_logs" | "bookings" | "audit_logs";

interface ApiSearchRow {
  id: string;
  provider: string | null;
  search_type: string | null;
  search_params: Record<string, unknown> | null;
  results_count: number | null;
  response_time_ms: number | null;
  created_at: string;
}

interface BookingRow {
  id: string;
  booking_type: string | null;
  status: string | null;
  payment_status: string | null;
  total_price: number | null;
  currency: string | null;
  details_json: Record<string, unknown> | null;
  created_at: string;
}

interface AuditRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  actor_admin_id: string;
  created_at: string;
}

interface UnifiedApiLog {
  id: string;
  source: LogSource;
  action: LogAction;
  type: string;
  provider: string;
  status: LogStatus;
  createdAt: string;
  entityId?: string | null;
  actorAdminId?: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

const LOG_TYPES = [
  { value: "", label: "كل السجلات" },
  { value: "flight_search", label: "بحث رحلات" },
  { value: "hotel_search", label: "بحث فنادق" },
  { value: "car_search", label: "بحث سيارات" },
  { value: "tour_search", label: "بحث جولات" },
  { value: "transfer_search", label: "بحث نقل" },
  { value: "flight_booking", label: "حجز رحلات" },
  { value: "hotel_booking", label: "حجز فنادق" },
  { value: "car_booking", label: "حجز سيارات" },
  { value: "tour_booking", label: "حجز جولات" },
  { value: "transfer_booking", label: "حجز نقل" },
  { value: "amadeus_error", label: "أخطاء Amadeus" },
  { value: "travelpayouts_error", label: "أخطاء Travelpayouts" },
];

const LOG_ACTIONS: { value: "" | LogAction; label: string }[] = [
  { value: "", label: "كل الإجراءات" },
  { value: "search", label: "بحث" },
  { value: "book", label: "حجز" },
  { value: "error", label: "خطأ" },
];

const STATUS_STYLES: Record<LogStatus, string> = {
  success: "bg-green-500/10 text-green-400",
  error: "bg-destructive/10 text-destructive",
  pending: "bg-yellow-500/10 text-yellow-400",
};

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function statusFromBookingStatus(status: string, paymentStatus: string): LogStatus {
  const s = String(status || "").toLowerCase();
  const p = String(paymentStatus || "").toLowerCase();
  if (["failed", "cancelled", "refunded", "error"].includes(s) || ["failed", "refunded"].includes(p)) return "error";
  if (["confirmed", "completed", "success"].includes(s) && p === "paid") return "success";
  return "pending";
}

function isErrorAudit(row: AuditRow): boolean {
  const action = (row.action || "").toLowerCase();
  const entityType = (row.entity_type || "").toLowerCase();
  const after = asObject(row.after);
  return action.includes("error") || entityType.includes("error") || typeof after.error === "string";
}

function iconFor(log: UnifiedApiLog): ReactNode {
  if (log.type.includes("flight")) return <Plane className="w-4 h-4 text-blue-400" />;
  if (log.type.includes("hotel")) return <Hotel className="w-4 h-4 text-emerald-400" />;
  if (log.type.includes("car")) return <Car className="w-4 h-4 text-orange-400" />;
  if (log.type.includes("tour")) return <Map className="w-4 h-4 text-pink-400" />;
  if (log.type.includes("transfer")) return <ArrowRightLeft className="w-4 h-4 text-cyan-400" />;
  if (log.action === "error") return <AlertTriangle className="w-4 h-4 text-destructive" />;
  return <ScrollText className="w-4 h-4 text-muted-foreground" />;
}

export default function AdminApiLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<UnifiedApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<"" | LogAction>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 40;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [searchRes, bookingRes, auditRes] = await Promise.allSettled([
        supabase
          .from("api_search_logs")
          .select("id, provider, search_type, search_params, results_count, response_time_ms, created_at")
          .order("created_at", { ascending: false })
          .limit(800),
        supabase
          .from("bookings")
          .select("id, booking_type, status, payment_status, total_price, currency, details_json, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("audit_logs")
          .select("id, action, entity_type, entity_id, before, after, actor_admin_id, created_at")
          .order("created_at", { ascending: false })
          .limit(400),
      ]);

      let allFailed = true;
      const merged: UnifiedApiLog[] = [];

      if (searchRes.status === "fulfilled" && !searchRes.value.error) {
        allFailed = false;
        const rows = (searchRes.value.data || []) as ApiSearchRow[];
        merged.push(
          ...rows.map((row) => {
            const status: LogStatus =
              row.search_params?.status === "error" ? "error" : (row.results_count || 0) > 0 ? "success" : "pending";
            return {
              id: `search_${row.id}`,
              source: "api_search_logs",
              action: status === "error" ? "error" : "search",
              type: `${row.search_type || "unknown"}_search`,
              provider: row.provider || "unknown",
              status,
              createdAt: row.created_at,
              request: row.search_params || {},
              response: {
                results_count: row.results_count || 0,
                response_time_ms: row.response_time_ms || 0,
              },
            };
          }),
        );
      }

      if (bookingRes.status === "fulfilled" && !bookingRes.value.error) {
        allFailed = false;
        const rows = (bookingRes.value.data || []) as BookingRow[];
        merged.push(
          ...rows.map((row) => {
            const details = asObject(row.details_json);
            const type = `${row.booking_type || String(details.flow || "unknown")}_booking`;
            const provider = String(details.api_provider || details.source || "internal");
            return {
              id: `booking_${row.id}`,
              source: "bookings",
              action: "book",
              type,
              provider,
              status: statusFromBookingStatus(row.status || "", row.payment_status || ""),
              createdAt: row.created_at,
              entityId: row.id,
              request: { booking_type: row.booking_type, details },
              response: {
                status: row.status,
                payment_status: row.payment_status,
                amount: row.total_price || 0,
                currency: row.currency || "SAR",
                api_offer_id: details.api_offer_id || details.amadeus_offer_id || null,
                api_confirmation_id: details.api_confirmation_id || details.amadeus_order_id || null,
              },
            };
          }),
        );
      }

      if (auditRes.status === "fulfilled" && !auditRes.value.error) {
        allFailed = false;
        const rows = (auditRes.value.data || []) as AuditRow[];
        const errorRows = rows.filter(isErrorAudit);
        merged.push(
          ...errorRows.map((row) => ({
            id: `audit_${row.id}`,
            source: "audit_logs" as const,
            action: "error" as const,
            type: row.entity_type || "api_error",
            provider: row.entity_type?.includes("travelpayouts") ? "travelpayouts" : "amadeus",
            status: "error" as const,
            createdAt: row.created_at,
            entityId: row.entity_id,
            actorAdminId: row.actor_admin_id,
            request: row.before || {},
            response: row.after || {},
          })),
        );
      }

      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLogs(merged);

      if (allFailed) {
        toast({ title: "خطأ", description: "تعذر تحميل سجلات الـ APIs", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (typeFilter && log.type !== typeFilter) return false;
      if (actionFilter && log.action !== actionFilter) return false;
      if (!search) return true;
      const needle = search.toLowerCase();
      return (
        log.type.toLowerCase().includes(needle) ||
        log.provider.toLowerCase().includes(needle) ||
        (log.entityId || "").toLowerCase().includes(needle) ||
        JSON.stringify(log.request).toLowerCase().includes(needle) ||
        JSON.stringify(log.response).toLowerCase().includes(needle)
      );
    });
  }, [logs, typeFilter, actionFilter, search]);

  useEffect(() => setPage(0), [search, typeFilter, actionFilter]);

  const pageStart = page * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const stats = useMemo(() => {
    const searches = filtered.filter((l) => l.action === "search").length;
    const bookings = filtered.filter((l) => l.action === "book").length;
    const errors = filtered.filter((l) => l.action === "error" || l.status === "error").length;
    const responseTimes = filtered
      .map((l) => Number(l.response?.response_time_ms))
      .filter((n) => Number.isFinite(n) && n > 0);
    const avgResponse = responseTimes.length ? Math.round(responseTimes.reduce((s, n) => s + n, 0) / responseTimes.length) : 0;
    return { searches, bookings, errors, avgResponse };
  }, [filtered]);

  const formatDate = (value: string) => {
    const d = new Date(value);
    return `${d.toLocaleDateString("ar-SA")} ${d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ScrollText className="w-7 h-7 text-primary" /> سجلات APIs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">بحث + حجز + أخطاء من Amadeus وTravelpayouts والأنظمة المرتبطة</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.searches}</p>
          <p className="text-xs text-blue-300 mt-1">عمليات بحث</p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.bookings}</p>
          <p className="text-xs text-green-300 mt-1">عمليات حجز</p>
        </div>
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
          <p className="text-2xl font-bold text-destructive">{stats.errors}</p>
          <p className="text-xs text-destructive/70 mt-1">أخطاء</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
          <p className="text-2xl font-bold text-purple-400">{stats.avgResponse}ms</p>
          <p className="text-xs text-purple-300 mt-1">متوسط الاستجابة</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث في السجلات..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 bg-muted/30" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 rounded-xl bg-muted border border-border text-foreground text-sm">
          {LOG_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as "" | LogAction)}
          className="px-4 py-2 rounded-xl bg-muted border border-border text-foreground text-sm"
        >
          {LOG_ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : pageItems.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p>لا توجد سجلات مطابقة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pageItems.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id} className="rounded-xl bg-card border border-border overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : log.id)} className="w-full flex items-center gap-4 p-4 text-right hover:bg-muted/20 transition-colors">
                  <div className="shrink-0">{iconFor(log)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[log.status]}`}>
                        {log.status === "success" ? "✓ نجاح" : log.status === "error" ? "✕ خطأ" : "◌ قيد التنفيذ"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{log.action}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">{log.provider}</span>
                      <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                        {log.type}
                      </span>
                    </div>
                    {log.entityId && (
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate" dir="ltr">
                        ID: {log.entityId}
                      </p>
                    )}
                  </div>
                  {"response_time_ms" in log.response && (
                    <span className="hidden md:inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="w-3.5 h-3.5" />
                      {Number(log.response.response_time_ms) || 0}ms
                    </span>
                  )}
                  {"amount" in log.response && (
                    <span className="hidden md:inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <DollarSign className="w-3.5 h-3.5" />
                      {Number(log.response.amount || 0).toLocaleString("ar-SA")}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">{formatDate(log.createdAt)}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border space-y-3 pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">الطلب (Request)</p>
                      <pre className="text-xs bg-muted/30 p-3 rounded-lg overflow-x-auto max-h-52 text-foreground" dir="ltr">
                        {JSON.stringify(log.request, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">الاستجابة (Response)</p>
                      <pre className="text-xs bg-muted/30 p-3 rounded-lg overflow-x-auto max-h-52 text-foreground" dir="ltr">
                        {JSON.stringify(log.response, null, 2)}
                      </pre>
                    </div>
                    {log.actorAdminId && (
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        Actor: {log.actorAdminId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          السابق
        </Button>
        <span className="text-sm text-muted-foreground">
          صفحة {page + 1} من {Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
        </span>
        <Button variant="outline" size="sm" disabled={pageStart + PAGE_SIZE >= filtered.length} onClick={() => setPage((p) => p + 1)}>
          التالي
        </Button>
      </div>
    </div>
  );
}
