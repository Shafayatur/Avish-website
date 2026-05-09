import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, ShoppingBag, Mail, Phone, MapPin, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import usePageTitle from "@/hooks/usePageTitle";

type SortKey = "newest" | "most_orders" | "highest_spend";

const AdminCustomers = () => {
  usePageTitle("Admin — Customers");
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [profilesRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      ]);

      const profiles = profilesRes.data || [];
      const allOrders = ordersRes.data || [];
      setOrders(allOrders);

      const enriched = profiles.map(p => {
        const userOrders = allOrders.filter(o => o.user_id === p.id);
        const totalSpend = userOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
        return { ...p, orderCount: userOrders.length, totalSpend };
      });

      setCustomers(enriched);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const exportCSV = () => {
    const rows = [
      ["Name", "Phone", "City", "Orders", "Total Spend", "Joined"],
      ...filtered.map(c => [
        c.full_name || "",
        c.phone || "",
        c.city || "",
        c.orderCount,
        c.totalSpend.toFixed(0),
        new Date(c.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = customers
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.full_name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.city?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "most_orders") return b.orderCount - a.orderCount;
      if (sortBy === "highest_spend") return b.totalSpend - a.totalSpend;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display text-xl">Customers</h3>
          <p className="font-body text-xs text-muted-foreground mt-1">{filtered.length} of {customers.length} customers</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
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

      {/* Search + Sort */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone or city..." className="pl-9 rounded-xl" />
        </div>
        <div className="flex gap-2">
          {([
            { key: "newest", label: "Newest" },
            { key: "most_orders", label: "Most Orders" },
            { key: "highest_spend", label: "Top Spend" },
          ] as { key: SortKey; label: string }[]).map(s => (
            <Button
              key={s.key}
              variant={sortBy === s.key ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy(s.key)}
              className="rounded-full font-body text-xs gap-1"
            >
              <ArrowUpDown size={10} />
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="glass-card rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display text-xl text-muted-foreground">No customers found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const customerOrders = orders.filter(o => o.user_id === c.id);
            const isExpanded = expanded === c.id;

            return (
              <div key={c.id} className="glass-card rounded-xl overflow-hidden">
                {/* Customer Row */}
                <div
                  className="p-4 flex flex-wrap items-center gap-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                >
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-[150px]">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-display text-sm text-primary">{c.full_name?.charAt(0) || "?"}</span>
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium">{c.full_name || "—"}</p>
                      <p className="font-body text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="hidden md:block space-y-0.5">
                    {c.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={10} className="text-muted-foreground" />
                        <span className="font-body text-xs">{c.phone}</span>
                      </div>
                    )}
                    {c.city && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={10} className="text-muted-foreground" />
                        <span className="font-body text-xs">{c.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Orders */}
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag size={12} className="text-muted-foreground" />
                    <span className={`font-body text-sm ${c.orderCount > 0 ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Spend */}
                  <span className={`font-display text-sm ${c.totalSpend > 0 ? "text-primary" : "text-muted-foreground"}`}>
                    {c.totalSpend > 0 ? `৳${c.totalSpend.toFixed(0)}` : "—"}
                  </span>

                  {/* Expand icon */}
                  {customerOrders.length > 0 && (
                    <div className="text-muted-foreground ml-auto">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  )}
                </div>

                {/* Expanded Order History */}
                {isExpanded && customerOrders.length > 0 && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
                    <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-3">Order History</p>
                    {customerOrders.map(order => (
                      <div key={order.id} className="flex items-center gap-3 bg-muted/20 rounded-xl p-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
                          <p className="font-body text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <p className="font-body text-xs text-muted-foreground">{order.order_items?.length || 0} items</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-body text-[10px] capitalize ${statusColors[order.status] || "bg-muted"}`}>
                          {order.status}
                        </span>
                        <span className="font-display text-sm text-primary">৳{Number(order.total).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
