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
import { CheckCircle, User, ChevronDown, ChevronUp } from "lucide-react";
import { motion as m, AnimatePresence } from "framer-motion";
import usePageTitle from "@/hooks/usePageTitle";

const Checkout = () => {
  usePageTitle("Checkout");
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({ email: "", password: "" });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [form, setForm] = useState({
    shipping_name: "",
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_zip: "",
    shipping_phone: "",
    notes: "",
  });

  const total = totalPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast({ title: "Cart is empty", variant: "destructive" }); return; }
    if (!form.shipping_name || !form.shipping_phone || !form.shipping_address || !form.shipping_city) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);

    const orderId = crypto.randomUUID();

    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      user_id: user?.id || null,
      total,
      shipping_name: form.shipping_name,
      shipping_address: form.shipping_address,
      shipping_city: form.shipping_city,
      shipping_state: form.shipping_state || null,
      shipping_zip: form.shipping_zip || null,
      shipping_phone: form.shipping_phone,
      shipping_country: "BD",
      payment_method: "cod",
      notes: form.notes || null,
      status: "pending",
    });

    if (orderError) {
      toast({ title: "Order failed", description: orderError?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const orderItems = items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product?.name || "Unknown",
      product_image: item.product?.image_url || null,
      quantity: item.quantity,
      price: Number(item.product?.price || 0),
    }));

    await supabase.from("order_items").insert(orderItems);
    await clearCart();

    setOrderPlaced(orderId);
    setLoading(false);
  };

  const handleCreateAccount = async () => {
    if (!accountForm.email || !accountForm.password) {
      toast({ title: "Please enter email and password", variant: "destructive" });
      return;
    }
    setCreatingAccount(true);
    const { error } = await supabase.auth.signUp({
      email: accountForm.email,
      password: accountForm.password,
      options: { data: { full_name: form.shipping_name } },
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Check your email to confirm." });
      navigate("/orders");
    }
    setCreatingAccount(false);
  };

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (items.length === 0 && !orderPlaced) {
    navigate("/cart");
    return null;
  }

  // Order success screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-28 pb-20">
          <div className="container mx-auto px-6 max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-primary" />
              </div>
              <h1 className="font-display text-4xl mb-3">Order Placed!</h1>
              <p className="font-body text-muted-foreground mb-2">
                Thank you, <span className="text-foreground font-medium">{form.shipping_name}</span>!
              </p>
              <p className="font-body text-sm text-muted-foreground mb-2">
                Order ID: <span className="font-mono text-xs bg-muted px-2 py-1 rounded">#{orderPlaced.slice(0, 8)}</span>
              </p>
              <p className="font-body text-sm text-muted-foreground mb-8">
                We'll deliver to <span className="text-foreground">{form.shipping_address}, {form.shipping_city}</span>. Payment on delivery.
              </p>

              {/* Optional create account */}
              {!user && (
                <div className="glass-card rounded-2xl p-5 mb-6 text-left">
                  <button
                    onClick={() => setShowCreateAccount(!showCreateAccount)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User size={16} className="text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-body text-sm font-medium">Save your details for next time?</p>
                        <p className="font-body text-xs text-muted-foreground">Create a free account in seconds</p>
                      </div>
                    </div>
                    {showCreateAccount ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  <AnimatePresence>
                    {showCreateAccount && (
                      <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-3">
                          <div>
                            <Label className="font-body text-xs tracking-widest uppercase">Email</Label>
                            <Input
                              type="email"
                              value={accountForm.email}
                              onChange={e => setAccountForm(p => ({ ...p, email: e.target.value }))}
                              className="mt-1 rounded-xl"
                              placeholder="your@email.com"
                            />
                          </div>
                          <div>
                            <Label className="font-body text-xs tracking-widest uppercase">Password</Label>
                            <Input
                              type="password"
                              value={accountForm.password}
                              onChange={e => setAccountForm(p => ({ ...p, password: e.target.value }))}
                              className="mt-1 rounded-xl"
                              placeholder="Min 6 characters"
                            />
                          </div>
                          <Button
                            variant="hero"
                            className="w-full rounded-xl"
                            onClick={handleCreateAccount}
                            disabled={creatingAccount}
                          >
                            {creatingAccount ? "Creating..." : "Create Account"}
                          </Button>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => navigate("/shop")}>
                  Continue Shopping
                </Button>
                {user && (
                  <Button variant="hero" className="flex-1 rounded-full" onClick={() => navigate("/orders")}>
                    View Orders
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="font-display text-5xl font-light">Check<span className="italic text-gradient-rose">out</span></h1>
            {!user && (
              <p className="font-body text-sm text-muted-foreground mt-3">
                No account needed — fill in your details and order instantly.
                <button onClick={() => navigate("/auth")} className="text-primary hover:underline ml-1">
                  Sign in
                </button> if you have an account.
              </p>
            )}
          </motion.div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-display text-xl mb-6">Delivery Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label className="font-body text-xs tracking-widest uppercase">Full Name *</Label>
                      <Input value={form.shipping_name} onChange={e => updateField("shipping_name", e.target.value)} required className="mt-1.5 rounded-xl" placeholder="Your full name" />
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">Phone *</Label>
                      <Input value={form.shipping_phone} onChange={e => updateField("shipping_phone", e.target.value)} required className="mt-1.5 rounded-xl" placeholder="01XXXXXXXXX" />
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">City *</Label>
                      <Input value={form.shipping_city} onChange={e => updateField("shipping_city", e.target.value)} required className="mt-1.5 rounded-xl" placeholder="Dhaka" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="font-body text-xs tracking-widest uppercase">Full Address *</Label>
                      <Input value={form.shipping_address} onChange={e => updateField("shipping_address", e.target.value)} required className="mt-1.5 rounded-xl" placeholder="House, Road, Area..." />
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">District</Label>
                      <Input value={form.shipping_state} onChange={e => updateField("shipping_state", e.target.value)} className="mt-1.5 rounded-xl" placeholder="Optional" />
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">Postal Code</Label>
                      <Input value={form.shipping_zip} onChange={e => updateField("shipping_zip", e.target.value)} className="mt-1.5 rounded-xl" placeholder="Optional" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="font-body text-xs tracking-widest uppercase">Order Notes (optional)</Label>
                      <Textarea value={form.notes} onChange={e => updateField("notes", e.target.value)} className="mt-1.5 rounded-xl" placeholder="Special delivery instructions..." rows={2} />
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-display text-xl mb-4">Payment Method</h3>
                  <div className="flex items-center gap-3 p-4 border-2 border-primary rounded-xl bg-primary/5">
                    <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium">Cash on Delivery</p>
                      <p className="font-body text-xs text-muted-foreground">Pay when your order arrives at your door</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <div className="glass-card rounded-2xl p-6 sticky top-28">
                  <h3 className="font-display text-xl mb-6">Order Summary</h3>
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.product?.image_url
                            ? <img src={item.product.image_url} alt="" className="w-full h-full object-contain" />
                            : <span className="text-xs text-muted-foreground">—</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-xs line-clamp-1">{item.product?.name}</p>
                          <p className="font-body text-xs text-muted-foreground">×{item.quantity}</p>
                        </div>
                        <span className="font-body text-sm flex-shrink-0">৳{(item.quantity * Number(item.product?.price || 0)).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-4 space-y-2 mb-6">
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                      <span>৳{totalPrice.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-muted-foreground">Calculated later</span>
                    </div>
                    <div className="flex justify-between font-display text-xl pt-2 border-t border-border">
                      <span>Total</span>
                      <span className="text-primary">৳{total.toFixed(0)}</span>
                    </div>
                  </div>
                  <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={loading}>
                    {loading ? "Placing Order..." : "Place Order"}
                  </Button>
                  <p className="font-body text-xs text-muted-foreground text-center mt-3">
                    💰 Pay on delivery — no payment needed now
                  </p>
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
