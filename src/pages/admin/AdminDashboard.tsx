import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, Users, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import usePageTitle from "@/hooks/usePageTitle";

const StatCard = ({
  icon: Icon, label, value, sub, trend, trendUp
}: {
  icon: any; label: string; value: string; sub?: string; trend?: string; trendUp?: boolean;
}) => (
  <div className="glass-card rounded-xl p-6 space-y-3">
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon size={18} className="text-primary" />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 font-body text-xs px-2 py-1 rounded-full ${trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {trendUp ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="font-display text-3xl">{value}</p>
      <p className="font-body text-xs text-muted-foreground tracking-widest uppercase mt-1">{label}</p>
      {sub && <p className="font-body text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl px-4 py-3 text-sm">
        <p className="font-body text-xs text-muted-foreground mb-1">{label}</p>
        <p className="font-display text-lg text-primary">Tk {Number(payload[0].value).toFixed(0)}</p>
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  usePageTitle("Admin — Dashboard");
  const [stats, setStats] = useState({ products: 0, totalOrders: 0, customers: 0, revenue: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, thisMonthOrders: 0, lastMonthOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      const [prodRes, allOrdersRes, custRes, recentRes, thisMonthRes, lastMonthRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, created_at, status"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, status, created_at, shipping_name").order("created_at", { ascending: false }).limit(6),
        supabase.from("orders").select("id, total").gte("created_at", thisMonthStart),
        supabase.from("orders").select("id, total").gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
      ]);

      const allOrders = allOrdersRes.data || [];
      const revenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const thisMonthRevenue = (thisMonthRes.data || []).reduce((sum, o) => sum + Number(o.total), 0);
      const lastMonthRevenue = (lastMonthRes.data || []).reduce((sum, o) => sum + Number(o.total), 0);
      const thisMonthOrders = thisMonthRes.data?.length || 0;
      const lastMonthOrders = lastMonthRes.data?.length || 0;

      // Build last 6 months chart data
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
        const monthOrders = allOrders.filter(o => o.created_at >= start && o.created_at <= end);
        const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total), 0);
        months.push({
          month: d.toLocaleString("default", { month: "short" }),
          revenue: monthRevenue,
          orders: monthOrders.length,
        });
      }

      setStats({
        products: prodRes.count || 0,
        totalOrders: allOrders.length,
        customers: custRes.count || 0,
        revenue,
        thisMonthRevenue,
        lastMonthRevenue,
        thisMonthOrders,
        lastMonthOrders,
      });
      setRecentOrders(recentRes.data || []);
      setChartData(months);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const revenueTrend = stats.lastMonthRevenue > 0
    ? Math.abs(Math.round(((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)) + "%"
    : null;
  const ordersTrend = stats.lastMonthOrders > 0
    ? Math.abs(Math.round(((stats.thisMonthOrders - stats.lastMonthOrders) / stats.lastMonthOrders) * 100)) + "%"
    : null;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="glass-card rounded-xl h-32" />)}
      </div>
      <div className="glass-card rounded-xl h-64" />
    </div>
  );

  return (
    <div className="space-y-8">

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={`Tk ${stats.revenue.toFixed(0)}`}
          sub={`Tk ${stats.thisMonthRevenue.toFixed(0)} this month`}
          trend={revenueTrend || undefined}
          trendUp={stats.thisMonthRevenue >= stats.lastMonthRevenue}
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={String(stats.totalOrders)}
          sub={`${stats.thisMonthOrders} this month`}
          trend={ordersTrend || undefined}
          trendUp={stats.thisMonthOrders >= stats.lastMonthOrders}
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={String(stats.customers)}
        />
        <StatCard
          icon={Package}
          label="Products"
          value={String(stats.products)}
        />
      </div>

      {/* Revenue Chart */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-xl">Revenue Overview</h3>
            <p className="font-body text-xs text-muted-foreground mt-1">Last 6 months</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl text-primary">Tk {stats.thisMonthRevenue.toFixed(0)}</p>
            <p className="font-body text-xs text-muted-foreground">This month</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(14 45% 65%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(14 45% 65%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontFamily: "Montserrat", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontFamily: "Montserrat", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `Tk ${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(14 45% 65%)" strokeWidth={2} fill="url(#revenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-xl mb-6">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Order", "Customer", "Total", "Status", "Date"].map(h => (
                    <th key={h} className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 pr-4 font-body text-sm text-muted-foreground">#{order.id.slice(0, 8)}</td>
                    <td className="py-3 pr-4 font-body text-sm">{order.shipping_name || "—"}</td>
                    <td className="py-3 pr-4 font-display text-sm text-primary">Tk {Number(order.total).toFixed(0)}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full font-body text-xs capitalize ${statusColors[order.status] || "bg-muted"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 font-body text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
