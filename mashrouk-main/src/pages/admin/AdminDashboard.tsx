import { useEffect, useState } from "react";
import {
  CalendarDays, Users, Plane, DollarSign, Hotel, Car, Map, Bus,
  TrendingUp, TrendingDown, ArrowUpRight, Clock, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Loader2, BarChart3,
  Sparkles, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalBookings: number;
  totalUsers: number;
  totalRevenue: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  todayBookings: number;
  todayRevenue: number;
  flightBookings: number;
  hotelBookings: number;
  carBookings: number;
  tourBookings: number;
  transferBookings: number;
  guestBookings: number;
  recentBookings: any[];
  prevPeriodBookings: number;
  prevPeriodRevenue: number;
}

const BOOKING_TYPE_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  flight: { label: "طيران", icon: Plane, color: "text-blue-600", bg: "bg-blue-500/10" },
  hotel: { label: "فندق", icon: Hotel, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  car: { label: "سيارة", icon: Car, color: "text-orange-600", bg: "bg-orange-500/10" },
  tour: { label: "جولة", icon: Map, color: "text-purple-600", bg: "bg-purple-500/10" },
  transfer: { label: "نقل", icon: Bus, color: "text-pink-600", bg: "bg-pink-500/10" },
};

const STATUS_MAP: Record<string, { label: string; icon: any; color: string }> = {
  confirmed: { label: "مؤكد", icon: CheckCircle, color: "text-emerald-500" },
  pending: { label: "معلق", icon: Clock, color: "text-amber-500" },
  cancelled: { label: "ملغي", icon: XCircle, color: "text-red-500" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

      const [bookingsRes, profilesRes, guestRes] = await Promise.all([
        supabase.from("bookings").select("id, total_price, status, booking_type, created_at, currency, payment_status"),
        supabase.from("profiles").select("id"),
        supabase.from("guest_bookings").select("id"),
      ]);

      const allBookings = bookingsRes.data || [];
      const totalRevenue = allBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

      // Today's stats
      const todayBookings = allBookings.filter(b => b.created_at >= todayStart);
      const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

      // Last 30 days vs previous 30 days
      const last30 = allBookings.filter(b => b.created_at >= thirtyDaysAgo);
      const prev30 = allBookings.filter(b => b.created_at >= sixtyDaysAgo && b.created_at < thirtyDaysAgo);

      // By type
      const byType = (type: string) => allBookings.filter(b => b.booking_type === type).length;

      // By status
      const byStatus = (status: string) => allBookings.filter(b => b.status === status).length;

      setStats({
        totalBookings: allBookings.length,
        totalUsers: profilesRes.data?.length || 0,
        totalRevenue,
        confirmedBookings: byStatus("confirmed"),
        pendingBookings: byStatus("pending"),
        cancelledBookings: byStatus("cancelled"),
        todayBookings: todayBookings.length,
        todayRevenue,
        flightBookings: byType("flight"),
        hotelBookings: byType("hotel"),
        carBookings: byType("car"),
        tourBookings: byType("tour"),
        transferBookings: byType("transfer"),
        guestBookings: guestRes.data?.length || 0,
        recentBookings: allBookings
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 8),
        prevPeriodBookings: prev30.length,
        prevPeriodRevenue: prev30.reduce((sum, b) => sum + (b.total_price || 0), 0),
      });
    } catch {
      toast({ title: "خطأ", description: "تعذر تحميل البيانات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading || !stats) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const last30Bookings = stats.totalBookings; // simplified
  const bookingChange = calcChange(last30Bookings, stats.prevPeriodBookings);
  const revenueChange = calcChange(stats.totalRevenue, stats.prevPeriodRevenue);

  const kpiCards = [
    {
      icon: CalendarDays, label: "إجمالي الحجوزات", value: stats.totalBookings.toString(),
      sub: `${stats.todayBookings} اليوم`, change: bookingChange, color: "text-primary", bg: "bg-primary/10",
    },
    {
      icon: DollarSign, label: "إجمالي الإيرادات", value: `${stats.totalRevenue.toLocaleString()} ر.س`,
      sub: `${stats.todayRevenue.toLocaleString()} ر.س اليوم`, change: revenueChange, color: "text-emerald-600", bg: "bg-emerald-500/10",
    },
    {
      icon: Users, label: "المستخدمين المسجلين", value: stats.totalUsers.toString(),
      sub: `${stats.guestBookings} حجز ضيف`, change: null, color: "text-blue-600", bg: "bg-blue-500/10",
    },
    {
      icon: CheckCircle, label: "الحجوزات المؤكدة", value: stats.confirmedBookings.toString(),
      sub: `${stats.pendingBookings} معلق · ${stats.cancelledBookings} ملغي`,
      change: stats.totalBookings > 0 ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) : 0,
      color: "text-emerald-600", bg: "bg-emerald-500/10", isPercent: true,
    },
  ];

  const serviceCards = [
    { type: "flight", count: stats.flightBookings },
    { type: "hotel", count: stats.hotelBookings },
    { type: "car", count: stats.carBookings },
    { type: "tour", count: stats.tourBookings },
    { type: "transfer", count: stats.transferBookings },
  ];

  const quickActions = [
    { label: "التحليلات المتقدمة", icon: BarChart3, path: "/admin/analytics" },
    { label: "إدارة الحجوزات", icon: CalendarDays, path: "/admin/bookings" },
    { label: "إدارة المحتوى", icon: Sparkles, path: "/admin/site-content" },
    { label: "المستخدمين", icon: Users, path: "/admin/users" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">لوحة التحكم</h1>
          <p className="text-muted-foreground text-sm mt-1">نظرة عامة على أداء المنصة</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              {kpi.change !== null && (
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  kpi.change >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                }`}>
                  {kpi.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {(kpi as any).isPercent ? `${kpi.change}%` : `${kpi.change > 0 ? "+" : ""}${kpi.change}%`}
                </div>
              )}
            </div>
            <p className="text-2xl font-bold mb-1">{kpi.value}</p>
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Service Breakdown + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Services */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
          <h2 className="font-bold mb-5 flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            الحجوزات حسب الخدمة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {serviceCards.map((sc) => {
              const info = BOOKING_TYPE_MAP[sc.type];
              const Icon = info.icon;
              return (
                <div key={sc.type} className="p-4 rounded-xl bg-muted/30 border border-border text-center hover:border-primary/20 transition-all">
                  <div className={`w-10 h-10 mx-auto rounded-lg ${info.bg} flex items-center justify-center mb-2`}>
                    <Icon className={`w-5 h-5 ${info.color}`} />
                  </div>
                  <p className="text-xl font-bold">{sc.count}</p>
                  <p className="text-xs text-muted-foreground">{info.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="font-bold mb-5 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-primary" />
            إجراءات سريعة
          </h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-right"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <action.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium flex-1">{action.label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            آخر الحجوزات
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/bookings")}>
            عرض الكل <ExternalLink className="w-3.5 h-3.5 mr-1" />
          </Button>
        </div>
        {stats.recentBookings.length === 0 ? (
          <div className="text-center py-10">
            <AlertTriangle className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">لا توجد حجوزات بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentBookings.map((b) => {
              const typeInfo = BOOKING_TYPE_MAP[b.booking_type] || BOOKING_TYPE_MAP.flight;
              const statusInfo = STATUS_MAP[b.status] || STATUS_MAP.pending;
              const TypeIcon = typeInfo.icon;
              const StatusIcon = statusInfo.icon;
              return (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${typeInfo.bg} flex items-center justify-center`}>
                      <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} />
                    </div>
                    <div>
                      <span className="text-sm font-medium">{typeInfo.label}</span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary">{b.total_price?.toLocaleString()} {b.currency || "SAR"}</span>
                  <Badge variant="outline" className={`${statusInfo.color} gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { s: "confirmed", count: stats.confirmedBookings, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "مؤكدة" },
          { s: "pending", count: stats.pendingBookings, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "معلقة" },
          { s: "cancelled", count: stats.cancelledBookings, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "ملغية" },
        ].map((item) => (
          <div key={item.s} className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${item.bg} flex items-center justify-center`}>
              <item.icon className={`w-7 h-7 ${item.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{item.count}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground/70">
                {stats.totalBookings > 0 ? Math.round((item.count / stats.totalBookings) * 100) : 0}% من الإجمالي
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
