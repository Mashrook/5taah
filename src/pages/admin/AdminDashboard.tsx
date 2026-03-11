import { useEffect, useState } from "react";
import { CalendarDays, Users, Plane, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ bookings: 0, users: 0, revenue: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bookingsRes, profilesRes] = await Promise.all([
          supabase.from('bookings').select('id, total_price, status, booking_type, created_at, currency'),
          supabase.from('profiles').select('id'),
        ]);

        const allBookings = bookingsRes.data || [];
        const revenue = allBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

        setStats({
          bookings: allBookings.length,
          users: profilesRes.data?.length || 0,
          revenue,
        });
        setRecentBookings(allBookings.slice(0, 10));
      } catch {
        toast({ title: "خطأ", description: "تعذر تحميل البيانات", variant: "destructive" });
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { icon: CalendarDays, label: "إجمالي الحجوزات", value: stats.bookings.toString() },
    { icon: Users, label: "المستخدمين", value: stats.users.toString() },
    { icon: DollarSign, label: "الإيرادات", value: `${stats.revenue.toLocaleString()} ر.س` },
    { icon: Plane, label: "حجوزات نشطة", value: recentBookings.filter(b => b.status === 'confirmed').length.toString() },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">لوحة التحكم</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((stat) => (
          <div key={stat.label} className="p-6 rounded-2xl bg-gradient-card border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-6 h-6 text-primary" />
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-gradient-card border border-border/50">
        <h2 className="font-bold mb-4">آخر الحجوزات</h2>
        {recentBookings.length === 0 ? (
          <p className="text-muted-foreground text-sm">لا توجد حجوزات بعد</p>
        ) : (
          <div className="space-y-2">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <span className="text-sm font-medium">{b.booking_type}</span>
                <span className="text-sm text-primary">{b.total_price} {b.currency}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
