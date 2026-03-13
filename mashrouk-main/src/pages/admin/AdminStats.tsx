import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  BarChart3, TrendingUp, Users, CalendarDays, DollarSign,
  Plane, Hotel, Car, Map, RefreshCw, ArrowUpRight, ArrowDownRight,
  Percent, Target, AlertTriangle, Route, Timer, CheckCircle2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

interface BookingRecord {
  id: string;
  total_price: number;
  status: string;
  booking_type: string;
  created_at: string;
  currency: string;
  payment_status: string;
  details_json: {
    from?: string;
    to?: string;
    airline?: string;
    amadeus_offer_id?: string;
    amadeus_order_id?: string;
    traveler?: { name?: string };
    segments?: Array<{ from: string; to: string }>;
  };
}

export default function AdminStats() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [users, setUsers] = useState(0);
  const [searchCount, setSearchCount] = useState(0);
  const [apiSearchLogs, setApiSearchLogs] = useState<{ provider: string; search_type: string; results_count: number; response_time_ms: number; created_at: string }[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, profilesRes, searchLogsRes] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, created_at"),
        supabase.from("api_search_logs").select("provider, search_type, results_count, response_time_ms, created_at").order("created_at", { ascending: false }).limit(500),
      ]);
      setBookings((bookingsRes.data as BookingRecord[]) || []);
      setUsers(profilesRes.data?.length || 0);
      setApiSearchLogs((searchLogsRes.data as typeof apiSearchLogs) || []);

      // Search count from actual logs or estimate from bookings
      const logCount = searchLogsRes.data?.length || 0;
      setSearchCount(logCount > 0 ? logCount : (bookingsRes.data?.length || 0) * 8);
    } catch {
      toast({ title: "خطأ", description: "تعذر تحميل الإحصاءات", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Advanced KPIs ───
  const stats = useMemo(() => {
    const flightBookings = bookings.filter(b => b.booking_type === "flight");
    const confirmedBookings = bookings.filter(b => b.status === "confirmed");
    const paidBookings = bookings.filter(b => b.payment_status === "paid");
    const totalRevenue = bookings.reduce((s, b) => s + (b.total_price || 0), 0);
    const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;
    const conversionRate = searchCount > 0 ? (bookings.length / searchCount) * 100 : 0;

    // Most popular routes (from flight bookings)
    const routeMap: Record<string, number> = {};
    flightBookings.forEach(b => {
      const from = b.details_json?.from || "N/A";
      const to = b.details_json?.to || "N/A";
      const route = `${from} → ${to}`;
      routeMap[route] = (routeMap[route] || 0) + 1;
    });
    const topRoutes = Object.entries(routeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([route, count]) => ({ route, count }));

    // Most popular airlines
    const airlineMap: Record<string, number> = {};
    flightBookings.forEach(b => {
      const airline = b.details_json?.airline || "غير محدد";
      airlineMap[airline] = (airlineMap[airline] || 0) + 1;
    });
    const topAirlines = Object.entries(airlineMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([airline, count]) => ({ airline, count }));

    // Bookings by type
    const byType: Record<string, number> = {};
    bookings.forEach(b => { byType[b.booking_type] = (byType[b.booking_type] || 0) + 1; });

    // By month
    const byMonth: Record<string, { count: number; revenue: number }> = {};
    bookings.forEach(b => {
      const month = new Date(b.created_at).toLocaleDateString("ar-SA", { month: "short", year: "2-digit" });
      if (!byMonth[month]) byMonth[month] = { count: 0, revenue: 0 };
      byMonth[month].count++;
      byMonth[month].revenue += b.total_price || 0;
    });

    // With Amadeus order (successful API calls)
    const withAmadeusOrder = flightBookings.filter(b => b.details_json?.amadeus_order_id).length;
    const amadeusSuccessRate = flightBookings.length > 0 ? (withAmadeusOrder / flightBookings.length) * 100 : 0;

    // API provider analytics from search logs
    const amadeusSearches = apiSearchLogs.filter(l => l.provider === "amadeus");
    const travelpayoutsSearches = apiSearchLogs.filter(l => l.provider === "travelpayouts");
    const amadeusAvgTime = amadeusSearches.length > 0 ? amadeusSearches.reduce((s, l) => s + (l.response_time_ms || 0), 0) / amadeusSearches.length : 0;
    const travelpayoutsAvgTime = travelpayoutsSearches.length > 0 ? travelpayoutsSearches.reduce((s, l) => s + (l.response_time_ms || 0), 0) / travelpayoutsSearches.length : 0;
    const travelpayoutsSuccessCount = travelpayoutsSearches.filter(l => (l.results_count || 0) > 0).length;
    const travelpayoutsSuccessRate = travelpayoutsSearches.length > 0 ? (travelpayoutsSuccessCount / travelpayoutsSearches.length) * 100 : 0;

    // Search type breakdown
    const searchByType: Record<string, number> = {};
    apiSearchLogs.forEach(l => { searchByType[l.search_type || "unknown"] = (searchByType[l.search_type || "unknown"] || 0) + 1; });

    return {
      totalBookings: bookings.length,
      flightBookings: flightBookings.length,
      confirmedCount: confirmedBookings.length,
      paidCount: paidBookings.length,
      pendingCount: bookings.filter(b => b.status === "pending").length,
      cancelledCount: bookings.filter(b => b.status === "cancelled").length,
      totalRevenue,
      avgBookingValue,
      conversionRate,
      topRoutes,
      topAirlines,
      byType,
      byMonth,
      amadeusSuccessRate,
      withAmadeusOrder,
      amadeusSearches: amadeusSearches.length,
      travelpayoutsSearches: travelpayoutsSearches.length,
      amadeusAvgTime,
      travelpayoutsAvgTime,
      travelpayoutsSuccessRate,
      searchByType,
    };
  }, [bookings, searchCount, apiSearchLogs]);

  const pieData = Object.entries(stats.byType).map(([name, value]) => ({ name, value }));
  const chartData = Object.entries(stats.byMonth).slice(-8).map(([month, d]) => ({ month, count: d.count, revenue: d.revenue }));

  const TYPE_ICONS: Record<string, any> = { flight: Plane, hotel: Hotel, car: Car, tour: Map };

  const kpiCards = [
    { label: "إجمالي الحجوزات", value: stats.totalBookings.toLocaleString("ar-SA"), icon: CalendarDays, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "حجوزات الطيران", value: stats.flightBookings.toLocaleString("ar-SA"), icon: Plane, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
    { label: "المستخدمين", value: users.toLocaleString("ar-SA"), icon: Users, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { label: "الإيرادات الكلية", value: `${stats.totalRevenue.toLocaleString("ar-SA")} ر.س`, icon: DollarSign, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    { label: "متوسط قيمة الحجز", value: `${stats.avgBookingValue.toLocaleString("ar-SA", { maximumFractionDigits: 0 })} ر.س`, icon: Target, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { label: "نسبة التحويل", value: `${stats.conversionRate.toFixed(1)}%`, icon: Percent, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20", subtitle: "من البحث للحجز" },
    { label: "نجاح Amadeus API", value: `${stats.amadeusSuccessRate.toFixed(0)}%`, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", subtitle: `${stats.withAmadeusOrder} حجز مؤكد` },
    { label: "بحث Amadeus", value: stats.amadeusSearches.toLocaleString("ar-SA"), icon: Timer, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", subtitle: `${stats.amadeusAvgTime.toFixed(0)}ms متوسط` },
    { label: "بحث Travelpayouts", value: stats.travelpayoutsSearches.toLocaleString("ar-SA"), icon: Route, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", subtitle: `نجاح ${stats.travelpayoutsSuccessRate.toFixed(0)}%` },
    { label: "حجوزات مدفوعة", value: stats.paidCount.toLocaleString("ar-SA"), icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-primary" /> الإحصاءات المتقدمة
          </h1>
          <p className="text-muted-foreground text-sm mt-1">نظرة شاملة على أداء المنصة ومؤشرات Amadeus و Travelpayouts</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 ml-2" /> تحديث
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((s) => (
          <div key={s.label} className={`p-4 rounded-2xl border ${s.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            {s.subtitle && <p className="text-[10px] text-muted-foreground/70">{s.subtitle}</p>}
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Bookings + Revenue by month */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold mb-4 text-sm">الحجوزات والإيرادات الشهرية</h3>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#colorRevenue)" name="إيرادات (ر.س)" />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="حجوزات" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By type pie */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold mb-4 text-sm">الحجوزات حسب النوع</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 - Top Routes & Airlines */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Routes */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold mb-4 text-sm flex items-center gap-2 justify-end">
            أكثر المسارات طلباً <Route className="w-4 h-4 text-primary" />
          </h3>
          {stats.topRoutes.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">لا توجد بيانات مسارات</div>
          ) : (
            <div className="space-y-3">
              {stats.topRoutes.map((r, i) => (
                <div key={r.route} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">{r.count}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{r.route}</span>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: COLORS[i % COLORS.length], color: "#fff" }}>
                      {i + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Airlines */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold mb-4 text-sm flex items-center gap-2 justify-end">
            أكثر شركات الطيران <Plane className="w-4 h-4 text-primary" />
          </h3>
          {stats.topAirlines.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.topAirlines} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="airline" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="حجوزات" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Status breakdown & service breakdown */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        {/* Status */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold mb-4 text-sm">حالة الحجوزات</h3>
          <div className="space-y-3">
            {[
              { label: "مؤكدة", count: stats.confirmedCount, color: "bg-green-500", total: stats.totalBookings },
              { label: "معلقة", count: stats.pendingCount, color: "bg-yellow-500", total: stats.totalBookings },
              { label: "ملغاة", count: stats.cancelledCount, color: "bg-destructive", total: stats.totalBookings },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${s.color} transition-all`} style={{ width: s.total > 0 ? `${(s.count / s.total) * 100}%` : "0%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services Breakdown */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold mb-4 text-sm">حجوزات حسب الخدمة</h3>
          <div className="space-y-3">
            {Object.entries(stats.byType).map(([type, count], i) => {
              const Icon = TYPE_ICONS[type] || CalendarDays;
              const pct = stats.totalBookings > 0 ? (count / stats.totalBookings) * 100 : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold" style={{ color: COLORS[i % COLORS.length] }}>{count}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{type}</span>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Amadeus API Health */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 justify-end">
              صحة Amadeus API <Timer className="w-4 h-4 text-primary" />
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-green-500">{stats.withAmadeusOrder}</p>
                <p className="text-xs text-muted-foreground">طلبات ناجحة</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-yellow-500">{stats.flightBookings - stats.withAmadeusOrder}</p>
                <p className="text-xs text-muted-foreground">بدون تأكيد API</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Provider Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Amadeus vs Travelpayouts */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold mb-4 text-sm flex items-center gap-2 justify-end">
            مقارنة مزودي API <Target className="w-4 h-4 text-primary" />
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-emerald-500">{stats.amadeusSearches}</span>
                <span className="text-muted-foreground">Amadeus</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: (stats.amadeusSearches + stats.travelpayoutsSearches) > 0 ? `${(stats.amadeusSearches / (stats.amadeusSearches + stats.travelpayoutsSearches)) * 100}%` : "0%" }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">متوسط الاستجابة: {stats.amadeusAvgTime.toFixed(0)}ms</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-pink-500">{stats.travelpayoutsSearches}</span>
                <span className="text-muted-foreground">Travelpayouts</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-pink-500 transition-all" style={{ width: (stats.amadeusSearches + stats.travelpayoutsSearches) > 0 ? `${(stats.travelpayoutsSearches / (stats.amadeusSearches + stats.travelpayoutsSearches)) * 100}%` : "0%" }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">متوسط الاستجابة: {stats.travelpayoutsAvgTime.toFixed(0)}ms · نجاح: {stats.travelpayoutsSuccessRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        {/* Search type breakdown */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-bold mb-4 text-sm flex items-center gap-2 justify-end">
            عمليات البحث حسب النوع <BarChart3 className="w-4 h-4 text-primary" />
          </h3>
          {Object.keys(stats.searchByType).length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">لا توجد بيانات بحث بعد</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.searchByType).sort((a, b) => b[1] - a[1]).map(([type, count], i) => {
                const total = Object.values(stats.searchByType).reduce((s, v) => s + v, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold" style={{ color: COLORS[i % COLORS.length] }}>{count}</span>
                      <span className="text-sm text-muted-foreground">{type}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
