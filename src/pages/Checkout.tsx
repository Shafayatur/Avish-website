import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shipping_name: "",
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_zip: "",
    shipping_phone: "",
    notes: "",
  });

  const shipping = totalPrice >= 500 ? 0 : 60;
  const total = totalPrice + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); navigate("/auth"); return; }
    if (items.length === 0) { toast({ title: "Cart is empty", variant: "destructive" }); return; }

    setLoading(true);

    const { data: order, error: orderError } = await supabase.from("orders").insert({
      user_id: user.id,
      total,
      shipping_name: form.shipping_name,
      shipping_address: form.shipping_address,
      shipping_city: form.shipping_city,
      shipping_state: form.shipping_state,
      shipping_zip: form.shipping_zip,
      shipping_phone: form.shipping_phone,
      shipping_country: "BD",
      payment_method: "cod",
      notes: form.notes || null,
    }).select().single();

    if (orderError || !order) {
      toast({ title: "Order failed", description: orderError?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product?.name || "Unknown",
      product_image: item.product?.image_url || null,
      quantity: item.quantity,
      price: Number(item.product?.price || 0),
    }));

    await supabase.from("order_items").insert(orderItems);
    await clearCart();

    toast({ title: "Order placed!", description: "You will pay on delivery." });
    navigate("/orders");
    setLoading(false);
  };

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="font-display text-5xl font-light">Check<span className="italic text-gradient-rose">out</span></h1>
          </motion.div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-display text-xl mb-6">Shipping Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label className="font-body text-xs tracking-widest uppercase">Full Name</Label>
                      <Input value={form.shipping_name} onChange={e => updateField("shipping_name", e.target.value)} required className="mt-1.5 rounded-xl" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="font-body text-xs tracking-widest uppercase">Address</Label>
                      <Input value={form.shipping_address} onChange={e => updateField("shipping_address", e.target.value)} required className="mt-1.5 rounded-xl" />
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">City</Label>
                      <Input value={form.shipping_city} onChange={e => updateField("shipping_city", e.target.value)} required className="mt-1.5 rounded-xl" />
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">District</Label>
                      <Input value={form.shipping_state} onChange={e => updateField("shipping_state", e.target.value)} required className="mt-1.5 rounded-xl" />
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">Postal Code</Label>
                      <Input value={form.shipping_zip} onChange={e => updateField("shipping_zip", e.target.value)} required className="mt-1.5 rounded-xl" />
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">Phone</Label>
                      <Input value={form.shipping_phone} onChange={e => updateField("shipping_phone", e.target.value)} required className="mt-1.5 rounded-xl" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="font-body text-xs tracking-widest uppercase">Order Notes (optional)</Label>
                      <Textarea value={form.notes} onChange={e => updateField("notes", e.target.value)} className="mt-1.5 rounded-xl" placeholder="Special delivery instructions..." />
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-display text-xl mb-4">Payment Method</h3>
                  <div className="flex items-center gap-3 p-4 border-2 border-primary rounded-xl bg-primary/5">
                    <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium">Cash on Delivery</p>
                      <p className="font-body text-xs text-muted-foreground">Pay when your order arrives</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="glass-card rounded-2xl p-6 sticky top-28">
                  <h3 className="font-display text-xl mb-6">Order Summary</h3>
                  <div className="space-y-3 mb-6">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between font-body text-sm">
                        <span className="text-muted-foreground truncate mr-2">{item.product?.name} × {item.quantity}</span>
                        <span>৳{(item.quantity * Number(item.product?.price || 0)).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between font-body text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>{shipping === 0 ? "Free" : `৳${shipping.toFixed(2)}`}</span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between font-display text-xl">
                      <span>Total</span>
                      <span className="text-primary">৳{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={loading}>
                    {loading ? "Placing Order..." : "Place Order (COD)"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
