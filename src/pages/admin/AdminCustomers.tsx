import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, ShoppingBag, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import usePageTitle from "@/hooks/usePageTitle";

const AdminCustomers = () => {
  usePageTitle("Admin — Customers");
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      const [profilesRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id, total"),
      ]);

      const profiles = profilesRes.data || [];
      const orders = ordersRes.data || [];

      // Get emails from auth.users via admin API isn't available client-side
      // So we join order counts to profiles
      const enriched = profiles.map(p => {
        const userOrders = orders.filter(o => o.user_id === p.id);
        const totalSpend = userOrders.reduce((s, o) => s + Number(o.total), 0);
        return { ...p, orderCount: userOrders.length, totalSpend };
      });

      setCustomers(enriched);
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl">Customers</h3>
          <p className="font-body text-xs text-muted-foreground mt-1">{filtered.length} of {customers.length} customers</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display text-2xl text-primary">{customers.length}</p>
          <p className="font-body text-xs text-muted-foreground tracking-widest uppercase mt-1">Total</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display text-2xl text-primary">{customers.filter(c => c.orderCount > 0).length}</p>
          <p className="font-body text-xs text-muted-foreground tracking-widest uppercase mt-1">Ordered</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display text-2xl text-primary">৳{customers.reduce((s, c) => s + c.totalSpend, 0).toFixed(0)}</p>
          <p className="font-body text-xs text-muted-foreground tracking-widest uppercase mt-1">Revenue</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone or city..."
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="glass-card rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display text-xl text-muted-foreground">No customers found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                {["Customer", "Contact", "Location", "Orders", "Total Spend", "Joined"].map(h => (
                  <th key={h} className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-display text-sm text-primary">{c.full_name?.charAt(0) || "?"}</span>
                      </div>
                      <p className="font-body text-sm font-medium">{c.full_name || "—"}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      {c.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail size={11} className="text-muted-foreground flex-shrink-0" />
                          <span className="font-body text-xs text-muted-foreground">{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={11} className="text-muted-foreground flex-shrink-0" />
                          <span className="font-body text-xs">{c.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {c.city ? (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-muted-foreground flex-shrink-0" />
                        <span className="font-body text-sm">{c.city}</span>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag size={11} className="text-muted-foreground" />
                      <span className={`font-body text-sm ${c.orderCount > 0 ? "text-primary font-medium" : "text-muted-foreground"}`}>
                        {c.orderCount}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-display text-sm ${c.totalSpend > 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {c.totalSpend > 0 ? `৳${c.totalSpend.toFixed(0)}` : "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-body text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
