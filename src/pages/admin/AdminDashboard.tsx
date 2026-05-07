import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="glass-card rounded-xl p-6">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        <Icon size={20} className="text-primary-foreground" />
      </div>
      <div>
        <p className="font-body text-xs text-muted-foreground tracking-widest uppercase">{label}</p>
        <p className="font-display text-2xl">{value}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [prodRes, orderRes, custRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, status, created_at, shipping_name").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      const allOrders = await supabase.from("orders").select("total");
      const revenue = (allOrders.data || []).reduce((sum: number, o: any) => sum + Number(o.total), 0);

      setStats({
        products: prodRes.count || 0,
        orders: orderRes.data?.length || 0,
        customers: custRes.count || 0,
        revenue,
      });
      setRecentOrders(orderRes.data || []);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Package} label="Products" value={String(stats.products)} color="bg-primary" />
        <StatCard icon={ShoppingCart} label="Orders" value={String(stats.orders)} color="bg-accent" />
        <StatCard icon={Users} label="Customers" value={String(stats.customers)} color="bg-deep-rose" />
        <StatCard icon={DollarSign} label="Revenue" value={`$${stats.revenue.toFixed(2)}`} color="bg-rose-gold" />
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-xl mb-4">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Order</th>
                  <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Customer</th>
                  <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Total</th>
                  <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Status</th>
                  <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-border/50">
                    <td className="py-3 font-body text-sm">#{order.id.slice(0, 8)}</td>
                    <td className="py-3 font-body text-sm">{order.shipping_name || "—"}</td>
                    <td className="py-3 font-body text-sm">${Number(order.total).toFixed(2)}</td>
                    <td className="py-3"><span className="px-2 py-1 rounded-full font-body text-xs capitalize bg-muted">{order.status}</span></td>
                    <td className="py-3 font-body text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
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
