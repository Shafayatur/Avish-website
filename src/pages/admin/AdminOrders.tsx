import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, ChevronDown, ChevronUp, Package, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import usePageTitle from "@/hooks/usePageTitle";

const statusOptions = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminOrders = () => {
  usePageTitle("Admin — Orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, status: string, previousStatus: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Restore stock if order is cancelled
    if (status === "cancelled" && previousStatus !== "cancelled") {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);

      if (orderItems) {
        for (const item of orderItems) {
          const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();
          if (product) {
            await supabase
              .from("products")
              .update({ stock: product.stock + item.quantity })
              .eq("id", item.product_id);
          }
        }
        toast({ title: "Order cancelled — stock restored" });
      }
    } else {
      toast({ title: "Status updated to " + status });
    }

    fetchOrders();
  };

  // Stats
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length;

  // Filter
  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.shipping_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_phone?.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl">Orders</h3>
          <p className="font-body text-xs text-muted-foreground mt-1">{filtered.length} of {orders.length} orders</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: "Tk " + totalRevenue.toFixed(0), icon: TrendingUp, color: "text-primary" },
          { label: "Today's Orders", value: String(todayOrders), icon: Package, color: "text-blue-600" },
          { label: "Pending", value: String(pendingCount), icon: Clock, color: "text-yellow-600" },
          { label: "Delivered", value: String(deliveredCount), icon: CheckCircle, color: "text-green-600" },
        ].map(stat => (
          <div key={stat.label} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <stat.icon size={16} className={stat.color} />
              </div>
              <div>
                <p className="font-display text-xl">{stat.value}</p>
                <p className="font-body text-[10px] text-muted-foreground tracking-widest uppercase">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, order ID or phone..."
            className="pl-9 rounded-xl"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", ...statusOptions].map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="rounded-full font-body text-xs capitalize"
            >
              {s}
              {s !== "all" && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({orders.filter(o => o.status === s).length})
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="glass-card rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display text-xl text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="glass-card rounded-xl overflow-hidden">
              {/* Order Row */}
              <div
                className="p-4 flex flex-wrap items-center gap-4 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                {/* Order ID + Customer */}
                <div className="flex-1 min-w-[160px]">
                  <p className="font-body text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
                  <p className="font-body text-sm font-medium">{order.shipping_name || "—"}</p>
                  <p className="font-body text-xs text-muted-foreground">{order.shipping_phone || ""}</p>
                </div>

                {/* Items count */}
                <div className="text-center hidden md:block">
                  <p className="font-body text-xs text-muted-foreground">Items</p>
                  <p className="font-body text-sm">{order.order_items?.length || 0}</p>
                </div>

                {/* Total */}
                <div className="text-right">
                  <p className="font-display text-lg text-primary">Tk {Number(order.total).toFixed(0)}</p>
                  <p className="font-body text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>

                {/* Status */}
                <select
                  value={order.status}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateStatus(order.id, e.target.value, order.status)}
                  className={`px-3 py-1 rounded-full font-body text-xs capitalize cursor-pointer border-0 ${statusColors[order.status] || "bg-muted"}`}
                >
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Expand icon */}
                <div className="text-muted-foreground">
                  {expandedOrder === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="px-4 pb-5 border-t border-border pt-4 space-y-4">
                  {/* Shipping Info */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                      <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-2">Shipping</p>
                      <p className="font-body text-sm">📍 {order.shipping_address}</p>
                      <p className="font-body text-sm">{order.shipping_city}{order.shipping_state ? ", " + order.shipping_state : ""} {order.shipping_zip || ""}</p>
                      <p className="font-body text-sm">📞 {order.shipping_phone || "—"}</p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                      <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-2">Payment</p>
                      <p className="font-body text-sm">💰 {order.payment_method?.toUpperCase() || "—"}</p>
                      <p className="font-body text-sm">🗓 {new Date(order.created_at).toLocaleString()}</p>
                      {order.notes && <p className="font-body text-sm">📝 {order.notes}</p>}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-3">Items</p>
                    <div className="space-y-2">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 bg-muted/20 rounded-xl p-2">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.product_image
                              ? <img src={item.product_image} alt="" className="max-h-full object-contain" />
                              : <span className="text-xs text-muted-foreground">—</span>
                            }
                          </div>
                          <span className="font-body text-sm flex-1 line-clamp-1">{item.product_name}</span>
                          <span className="font-body text-xs text-muted-foreground">×{item.quantity}</span>
                          <span className="font-display text-sm text-primary">Tk {(item.quantity * Number(item.price)).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Order Total Summary */}
                    <div className="flex justify-end mt-3 pt-3 border-t border-border">
                      <div className="text-right">
                        <p className="font-body text-xs text-muted-foreground">Order Total</p>
                        <p className="font-display text-xl text-primary">Tk {Number(order.total).toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
