import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusOptions = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Order status updated to ${status}` });
      fetchOrders();
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display text-xl">Orders ({orders.length})</h3>

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 flex flex-wrap items-center gap-4 cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
              <div className="flex-1 min-w-[200px]">
                <p className="font-body text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
                <p className="font-body text-sm font-medium">{order.shipping_name || "—"}</p>
              </div>
              <p className="font-display text-lg">৳{Number(order.total).toFixed(2)}</p>
              <p className="font-body text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
              <select
                value={order.status}
                onClick={e => e.stopPropagation()}
                onChange={e => updateStatus(order.id, e.target.value)}
                className={`px-3 py-1 rounded-full font-body text-xs capitalize cursor-pointer ${statusColors[order.status] || "bg-muted"}`}
              >
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {expandedOrder === order.id && (
              <div className="px-4 pb-4 border-t border-border pt-4 space-y-2">
                <div className="font-body text-xs text-muted-foreground space-y-1">
                  <p>📍 {order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
                  <p>📞 {order.shipping_phone}</p>
                  <p>💰 {order.payment_method?.toUpperCase()}</p>
                  {order.notes && <p>📝 {order.notes}</p>}
                </div>
                <div className="mt-3 space-y-2">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-cream flex items-center justify-center overflow-hidden">
                        {item.product_image ? <img src={item.product_image} alt="" className="max-h-full object-contain" /> : <span className="text-xs">—</span>}
                      </div>
                      <span className="font-body text-sm flex-1">{item.product_name}</span>
                      <span className="font-body text-xs text-muted-foreground">×{item.quantity}</span>
                      <span className="font-body text-sm">৳{(item.quantity * Number(item.price)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrders;
