import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="font-display text-5xl font-light">My <span className="italic text-gradient-rose">Orders</span></h1>
          </motion.div>

          {loading ? (
            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="glass-card rounded-xl p-6 animate-pulse h-24" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="font-display text-2xl text-muted-foreground mb-4">No orders yet</p>
              <Link to="/shop" className="text-primary hover:underline font-body">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {orders.map((order, i) => (
                <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="glass-card rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className="w-full p-6 flex items-center justify-between text-left">
                      <div>
                        <p className="font-body text-xs text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
                        <p className="font-display text-lg">৳{Number(order.total).toFixed(2)}</p>
                        <p className="font-body text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full font-body text-xs capitalize ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                          {order.status}
                        </span>
                        {expandedOrder === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {expandedOrder === order.id && (
                      <div className="px-6 pb-6 border-t border-border pt-4 space-y-3">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-cream flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.product_image ? <img src={item.product_image} alt={item.product_name} className="max-h-full object-contain" /> : <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                            <div className="flex-1">
                              <p className="font-body text-sm">{item.product_name}</p>
                              <p className="font-body text-xs text-muted-foreground">Qty: {item.quantity} × ৳{Number(item.price).toFixed(2)}</p>
                            </div>
                            <p className="font-body text-sm">৳{(item.quantity * Number(item.price)).toFixed(2)}</p>
                          </div>
                        ))}
                        <div className="pt-3 border-t border-border font-body text-xs text-muted-foreground space-y-1">
                          <p>Ship to: {order.shipping_name}, {order.shipping_address}, {order.shipping_city}</p>
                          <p>Payment: Cash on Delivery</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Orders;
