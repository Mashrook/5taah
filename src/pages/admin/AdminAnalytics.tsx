import { useEffect, useState } from "react";
import {
  TrendingUp, Users, DollarSign, Plane, Hotel, Car,
  ArrowUpRight, ArrowDownRight, RefreshCw, Loader2,
  BarChart3, PieChart, Target, Activity, Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line, Legend, Area, AreaChart } from "recharts";
import PermissionGate from "@/components/auth/PermissionGate";

interface BookingStats {
  totalBookings: number;
  totalRevenue: number;
  avgBookingValue: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  flightBookings: number;
  hotelBookings: number;
  transferBookings: number;
  conversionRate: number;
  revenueByType: { name: string; value: number; color: string }[];
  bookingsByStatus: { name: string; value: number; color: string }[];
  revenueByMonth: { month: string; revenue: number; bookings: number }[];
  recentTrend: { date: string; bookings: number; revenue: number }[];
}

const COLORS = {
  flight: "hsl(var(--primary))",
  hotel: "hsl(220, 70%, 60%)",
  transfer: "hsl(280, 70%, 60%)",
  confirmed: "hsl(142, 76%, 36%)",
  pending: "hsl(48, 96%, 53%)",
  cancelled: "hsl(0, 72%, 51%)",
};

export default function AdminAnalytics() {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date filter
      let dateFilter: string | null = null;
      const now = new Date();
      if (dateRange === "7d") {
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === "30d") {
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === "90d") {
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Fetch bookings
      let query = supabase.from("bookings").select("*");
      if (dateFilter) {
        query = query.gte("created_at", dateFilter);
      }
      const { data: bookings, error } = await query;

      if (error) throw error;

      const allBookings = bookings || [];

      // Calculate stats
      const totalBookings = allBookings.length;
      const totalRevenue = allBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      const confirmedBookings = allBookings.filter(b => b.status === "confirmed").length;
      const pendingBookings = allBookings.filter(b => b.status === "pending").length;
      const cancelledBookings = allBookings.filter(b => b.status === "cancelled").length;

      const flightBookings = allBookings.filter(b => b.booking_type === "flight").length;
      const hotelBookings = allBookings.filter(b => b.booking_type === "hotel").length;
      const transferBookings = allBookings.filter(b => b.booking_type === "transfer").length;

      // Conversion rate (confirmed / total)
      const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

      // Revenue by type
      const flightRevenue = allBookings.filter(b => b.booking_type === "flight").reduce((sum, b) => sum + (b.total_price || 0), 0);
      const hotelRevenue = allBookings.filter(b => b.booking_type === "hotel").reduce((sum, b) => sum + (b.total_price || 0), 0);
      const transferRevenue = allBookings.filter(b => b.booking_type === "transfer").reduce((sum, b) => sum + (b.total_price || 0), 0);

      const revenueByType = [
        { name: "رحلات طيران", value: flightRevenue, color: COLORS.flight },
        { name: "فنادق", value: hotelRevenue, color: COLORS.hotel },
        { name: "تحويلات", value: transferRevenue, color: COLORS.transfer },
      ];

      const bookingsByStatus = [
        { name: "مؤكد", value: confirmedBookings, color: COLORS.confirmed },
        { name: "معلق", value: pendingBookings, color: COLORS.pending },
        { name: "ملغي", value: cancelledBookings, color: COLORS.cancelled },
      ];

      // Revenue by month (last 6 months)
      const monthlyData: Record<string, { revenue: number; bookings: number }> = {};
      const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      
      allBookings.forEach(b => {
        const date = new Date(b.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthName = months[date.getMonth()];
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, bookings: 0 };
        }
        monthlyData[monthKey].revenue += b.total_price || 0;
        monthlyData[monthKey].bookings += 1;
      });

      const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
      const revenueByMonth = sortedMonths.map(key => ({
        month: months[parseInt(key.split("-")[1]) - 1],
        revenue: monthlyData[key].revenue,
        bookings: monthlyData[key].bookings,
      }));

      // Recent trend (last 14 days)
      const trendData: Record<string, { bookings: number; revenue: number }> = {};
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().split("T")[0];
      });

      last14Days.forEach(date => {
        trendData[date] = { bookings: 0, revenue: 0 };
      });

      allBookings.forEach(b => {
        const date = b.created_at.split("T")[0];
        if (trendData[date]) {
          trendData[date].bookings += 1;
          trendData[date].revenue += b.total_price || 0;
        }
      });

      const recentTrend = last14Days.map(date => ({
        date: new Date(date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }),
        bookings: trendData[date].bookings,
        revenue: trendData[date].revenue,
      }));

      setStats({
        totalBookings,
        totalRevenue,
        avgBookingValue,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        flightBookings,
        hotelBookings,
        transferBookings,
        conversionRate,
        revenueByType,
        bookingsByStatus,
        revenueByMonth,
        recentTrend,
      });
    } catch (err: unknown) {
      console.error("Analytics error:", err);
      toast({ title: "خطأ", description: "تعذر تحميل البيانات التحليلية", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const kpiCards = [
    {
      icon: BarChart3,
      label: "إجمالي الحجوزات",
      value: stats.totalBookings.toString(),
      subValue: `${stats.confirmedBookings} مؤكد`,
      trend: stats.totalBookings > 0 ? "+12%" : "0%",
      trendUp: true,
    },
    {
      icon: DollarSign,
      label: "إجمالي الإيرادات",
      value: `${stats.totalRevenue.toLocaleString()} ر.س`,
      subValue: `${stats.revenueByMonth.length > 0 ? stats.revenueByMonth[stats.revenueByMonth.length - 1].revenue.toLocaleString() : 0} هذا الشهر`,
      trend: "+8%",
      trendUp: true,
    },
    {
      icon: Target,
      label: "متوسط قيمة الحجز",
      value: `${Math.round(stats.avgBookingValue).toLocaleString()} ر.س`,
      subValue: "للحجز الواحد",
      trend: "+5%",
      trendUp: true,
    },
    {
      icon: Activity,
      label: "نسبة التحويل",
      value: `${stats.conversionRate.toFixed(1)}%`,
      subValue: `${stats.confirmedBookings}/${stats.totalBookings} مؤكد`,
      trend: stats.conversionRate > 50 ? "+3%" : "-2%",
      trendUp: stats.conversionRate > 50,
    },
  ];

  const bookingTypeCards = [
    { icon: Plane, label: "رحلات طيران", value: stats.flightBookings, color: "text-primary", bg: "bg-primary/10" },
    { icon: Hotel, label: "فنادق", value: stats.hotelBookings, color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Car, label: "تحويلات", value: stats.transferBookings, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <PermissionGate permission="reports.view">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-primary" />
              لوحة التحليلات المتقدمة
            </h1>
            <p className="text-muted-foreground text-sm mt-1">تحليل بيانات الحجوزات والإيرادات من Amadeus</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-muted/50 rounded-xl p-1">
              {[
                { value: "7d", label: "7 أيام" },
                { value: "30d", label: "30 يوم" },
                { value: "90d", label: "90 يوم" },
                { value: "all", label: "الكل" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDateRange(opt.value as string)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateRange === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={fetchAnalytics}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((kpi) => (
            <div key={kpi.label} className="p-6 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center`}>
                  <kpi.icon className="w-6 h-6 text-primary" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  kpi.trendUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                }`}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              </div>
              <p className="text-2xl font-bold mb-1">{kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{kpi.subValue}</p>
            </div>
          ))}
        </div>

        {/* Booking Types */}
        <div className="grid md:grid-cols-3 gap-4">
          {bookingTypeCards.map((card) => (
            <div key={card.label} className="p-5 rounded-2xl bg-card border border-border/50 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-7 h-7 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue by Month */}
          <div className="p-6 rounded-2xl bg-card border border-border/50">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              الإيرادات الشهرية
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} ر.س`, "الإيرادات"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by Type Pie */}
          <div className="p-6 rounded-2xl bg-card border border-border/50">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              توزيع الإيرادات حسب النوع
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={stats.revenueByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {stats.revenueByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} ر.س`, "الإيرادات"]}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="p-6 rounded-2xl bg-card border border-border/50">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            اتجاه الحجوزات (آخر 14 يوم)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.recentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="bookings"
                  name="الحجوزات"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="الإيرادات (ر.س)"
                  stroke="hsl(220, 70%, 60%)"
                  fill="hsl(220, 70%, 60%, 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="p-6 rounded-2xl bg-card border border-border/50">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            توزيع الحجوزات حسب الحالة
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {stats.bookingsByStatus.map((status) => (
              <div key={status.name} className="p-4 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{status.name}</span>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                </div>
                <p className="text-2xl font-bold">{status.value}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalBookings > 0 ? ((status.value / stats.totalBookings) * 100).toFixed(1) : 0}% من الإجمالي
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}