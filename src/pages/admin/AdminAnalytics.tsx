import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { AlertTriangle } from "lucide-react";
import usePageTitle from "@/hooks/usePageTitle";

const COLORS = ["hsl(14,45%,65%)", "hsl(350,35%,75%)", "hsl(25,30%,85%)", "hsl(40,35%,90%)", "hsl(14,50%,45%)", "hsl(350,45%,45%)"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl px-4 py-3 text-sm">
        <p className="font-body text-xs text-muted-foreground mb-1">{label || payload[0].name}</p>
        <p className="font-display text-lg text-primary">
          {payload[0].name === "revenue" || label ? `Tk ${Number(payload[0].value).toFixed(0)}` : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const AdminAnalytics = () => {
  usePageTitle("Admin — Analytics");
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [ordersRes, productsRes, orderItemsRes, profilesRes] = await Promise.all([
        supabase.from("orders").select("id, total, status, user_id"),
        supabase.from("products").select("id, name, stock, price, category_id, categories(name)").eq("is_active", true),
        supabase.from("order_items").select("product_id, product_name, quantity, price"),
        supabase.from("profiles").select("id, full_name"),
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const orderItems = orderItemsRes.data || [];
      const profiles = profilesRes.data || [];

      // Avg order value
      const avg = orders.length > 0 ? orders.reduce((s, o) => s + Number(o.total), 0) / orders.length : 0;
      setAvgOrderValue(avg);

      // Top products by revenue
      const productRevMap: Record<string, { name: string; revenue: number; qty: number }> = {};
      orderItems.forEach((item: any) => {
        if (!productRevMap[item.product_id]) {
          productRevMap[item.product_id] = { name: item.product_name, revenue: 0, qty: 0 };
        }
        productRevMap[item.product_id].revenue += Number(item.price) * item.quantity;
        productRevMap[item.product_id].qty += item.quantity;
      });
      const topProds = Object.values(productRevMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6);
      setTopProducts(topProds);

      // Revenue by category
      const catRevMap: Record<string, { name: string; revenue: number }> = {};
      orderItems.forEach((item: any) => {
        const product = products.find((p: any) => p.id === item.product_id);
        const catName = (product as any)?.categories?.name || "Uncategorized";
        if (!catRevMap[catName]) catRevMap[catName] = { name: catName, revenue: 0 };
        catRevMap[catName].revenue += Number(item.price) * item.quantity;
      });
      setCategoryRevenue(Object.values(catRevMap).sort((a, b) => b.revenue - a.revenue));

      // Order status breakdown
      const statusMap: Record<string, number> = {};
      orders.forEach((o: any) => {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
      });
      setOrderStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      // Low stock (below 10)
      const low = products
        .filter((p: any) => p.stock < 10)
        .sort((a: any, b: any) => a.stock - b.stock)
        .slice(0, 8);
      setLowStock(low);

      // Top customers by spend
      const custSpendMap: Record<string, { name: string; spend: number; orders: number }> = {};
      orders.forEach((o: any) => {
        if (!o.user_id) return;
        const profile = profiles.find((p: any) => p.id === o.user_id);
        const name = profile?.full_name || "Unknown";
        if (!custSpendMap[o.user_id]) custSpendMap[o.user_id] = { name, spend: 0, orders: 0 };
        custSpendMap[o.user_id].spend += Number(o.total);
        custSpendMap[o.user_id].orders += 1;
      });
      setTopCustomers(Object.values(custSpendMap).sort((a, b) => b.spend - a.spend).slice(0, 5));

      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="glass-card rounded-xl h-48" />)}
    </div>
  );

  return (
    <div className="space-y-8">
      <h3 className="font-display text-2xl">Analytics</h3>

      {/* Summary KPIs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="font-body text-xs tracking-widest uppercase text-muted-foreground">Avg Order Value</p>
          <p className="font-display text-3xl text-primary mt-2">Tk {avgOrderValue.toFixed(0)}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="font-body text-xs tracking-widest uppercase text-muted-foreground">Top Category</p>
          <p className="font-display text-3xl text-primary mt-2">{categoryRevenue[0]?.name || "—"}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="font-body text-xs tracking-widest uppercase text-muted-foreground">Low Stock Items</p>
          <p className={`font-display text-3xl mt-2 ${lowStock.length > 0 ? "text-destructive" : "text-primary"}`}>
            {lowStock.length}
          </p>
        </div>
      </div>

      {/* Top Products + Order Status */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products Bar Chart */}
        <div className="glass-card rounded-xl p-6">
          <h4 className="font-display text-lg mb-6">Top Products by Revenue</h4>
          {topProducts.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground text-center py-8">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontFamily: "Montserrat", fontSize: 10 }} tickFormatter={v => `Tk ${v}`} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontFamily: "Montserrat", fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="hsl(14,45%,65%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="glass-card rounded-xl p-6">
          <h4 className="font-display text-lg mb-6">Order Status Breakdown</h4>
          {orderStatus.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={orderStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {orderStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 min-w-[100px]">
                {orderStatus.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="font-body text-xs capitalize text-muted-foreground">{s.name}</span>
                    <span className="font-body text-xs font-medium ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="glass-card rounded-xl p-6">
        <h4 className="font-display text-lg mb-6">Revenue by Category</h4>
        {categoryRevenue.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground text-center py-8">No sales data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontFamily: "Montserrat", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontFamily: "Montserrat", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `Tk ${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="hsl(350,35%,75%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Low Stock + Top Customers */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={18} className={lowStock.length > 0 ? "text-destructive" : "text-muted-foreground"} />
            <h4 className="font-display text-lg">Low Stock Alerts</h4>
          </div>
          {lowStock.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">All products are well stocked ✓</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <p className="font-body text-sm line-clamp-1 flex-1">{p.name}</p>
                  <span className={`font-body text-xs px-2 py-1 rounded-full ml-4 flex-shrink-0 ${
                    p.stock === 0 ? "bg-destructive/10 text-destructive" :
                    p.stock < 5 ? "bg-orange-100 text-orange-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="glass-card rounded-xl p-6">
          <h4 className="font-display text-lg mb-6">Top Customers</h4>
          {topCustomers.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">No customer data yet</p>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-sm text-primary">{c.name?.charAt(0) || "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm line-clamp-1">{c.name}</p>
                    <p className="font-body text-xs text-muted-foreground">{c.orders} order{c.orders !== 1 ? "s" : ""}</p>
                  </div>
                  <p className="font-display text-sm text-primary flex-shrink-0">Tk {c.spend.toFixed(0)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
