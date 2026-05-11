import { useState, useEffect } from "react";
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
import { bdLocations, districts } from "@/data/bd-locations";
import { bdLocations, districts } from "@/data/bd-locations";

const Checkout = () => {
  usePageTitle("Checkout");
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "bkash" | "nagad">("bank");
  const [insideDhaka, setInsideDhaka] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({ email: "", password: "" });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [form, setForm] = useState({
    shipping_name: "",
    shipping_address: "",
    shipping_district: "",
    shipping_thana: "",
    shipping_phone: "",
    notes: "",
  });

  const deliveryCharge = insideDhaka ? 80 : 150;
  const total = totalPrice + deliveryCharge;

  // Autofill from profile if logged in
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setForm(prev => ({
          ...prev,
          shipping_name: data.full_name || prev.shipping_name,
          shipping_phone: data.phone || prev.shipping_phone,
          shipping_address: data.address || prev.shipping_address,
          shipping_district: data.city || prev.shipping_district,
        }));
      }
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast({ title: "Cart is empty", variant: "destructive" }); return; }
    if (!form.shipping_name || !form.shipping_phone || !form.shipping_address || !form.shipping_district) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);

    const orderId = crypto.randomUUID();

    // Check stock availability before placing order
    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("stock, name")
        .eq("id", item.product_id)
        .single();
      if (!product || product.stock < item.quantity) {
        toast({
          title: "Stock unavailable",
          description: `"${product?.name || "A product"}" only has ${product?.stock || 0} left in stock. Please update your cart.`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
    }

    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      user_id: user?.id || null,
      total,
      shipping_cost: deliveryCharge,
      shipping_name: form.shipping_name,
      shipping_address: form.shipping_address,
      shipping_city: form.shipping_district,
      shipping_state: form.shipping_thana || null,
      shipping_zip: null,
      shipping_phone: form.shipping_phone,
      shipping_country: "BD",
      payment_method: paymentMethod,
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

    // Deduct stock for each item
    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single();
      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity);
        await supabase.from("products").update({ stock: newStock }).eq("id", item.product_id);
      }
    }

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
                We'll deliver to <span className="text-foreground">{form.shipping_address}, {form.shipping_thana ? form.shipping_thana + ", " : ""}{form.shipping_district}</span>.
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
                    <div className="sm:col-span-2">
                      <Label className="font-body text-xs tracking-widest uppercase">Full Address *</Label>
                      <Input value={form.shipping_address} onChange={e => updateField("shipping_address", e.target.value)} required className="mt-1.5 rounded-xl" placeholder="House No, Road, Area..." />
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">District *</Label>
                      <input
                        list="districts"
                        value={form.shipping_district}
                        onChange={e => { updateField("shipping_district", e.target.value); updateField("shipping_thana", ""); }}
                        required
                        className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Select or type district..."
                      />
                      <datalist id="districts">
                        {districts.map(d => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">Thana / Upazila *</Label>
                      <input
                        list="thanas"
                        value={form.shipping_thana}
                        onChange={e => updateField("shipping_thana", e.target.value)}
                        required
                        className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Select or type thana..."
                      />
                      <datalist id="thanas">
                        {(bdLocations[form.shipping_district] || []).map(t => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="font-body text-xs tracking-widest uppercase">Order Notes (optional)</Label>
                      <Textarea value={form.notes} onChange={e => updateField("notes", e.target.value)} className="mt-1.5 rounded-xl" placeholder="Special delivery instructions..." rows={2} />
                    </div>
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-display text-xl mb-4">Delivery Location</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInsideDhaka(true)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${insideDhaka ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full border-2 ${insideDhaka ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                        <p className="font-body text-sm font-medium">Inside Dhaka</p>
                      </div>
                      <p className="font-display text-lg text-primary">Tk 80</p>
                      <p className="font-body text-xs text-muted-foreground">1-2 days</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInsideDhaka(false)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${!insideDhaka ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full border-2 ${!insideDhaka ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                        <p className="font-body text-sm font-medium">Outside Dhaka</p>
                      </div>
                      <p className="font-display text-lg text-primary">Tk 150</p>
                      <p className="font-body text-xs text-muted-foreground">2-4 days</p>
                    </button>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-display text-xl mb-4">Payment Method</h3>
                  <div className="space-y-3">
                    {/* Bank Transfer */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("bank")}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${paymentMethod === "bank" ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === "bank" ? "border-primary" : "border-muted-foreground"}`}>
                        {paymentMethod === "bank" && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-body text-sm font-medium">Bank Transfer</p>
                        <p className="font-body text-xs text-muted-foreground">Transfer to our bank account</p>
                      </div>
                    </button>

                    {/* Bank details */}
                    {paymentMethod === "bank" && (
                      <div className="ml-4 p-4 bg-muted/50 rounded-xl space-y-2">
                        <p className="font-body text-xs font-semibold text-foreground mb-3">Transfer to this account:</p>
                        <div className="grid grid-cols-2 gap-2 font-body text-xs">
                          <span className="text-muted-foreground">Bank</span>
                          <span className="font-medium">YOUR_BANK_NAME</span>
                          <span className="text-muted-foreground">Account Name</span>
                          <span className="font-medium">YOUR_ACCOUNT_NAME</span>
                          <span className="text-muted-foreground">Account No.</span>
                          <span className="font-medium font-mono">YOUR_ACCOUNT_NUMBER</span>
                          <span className="text-muted-foreground">Branch</span>
                          <span className="font-medium">YOUR_BRANCH_NAME</span>
                          <span className="text-muted-foreground">Routing No.</span>
                          <span className="font-medium font-mono">YOUR_ROUTING_NUMBER</span>
                        </div>
                        <p className="font-body text-xs text-primary mt-2">After transfer, enter your transaction ID below</p>
                        <input
                          type="text"
                          placeholder="Transaction ID / Reference"
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-input bg-background font-body text-sm"
                          onChange={e => {}}
                        />
                      </div>
                    )}

                    {/* bKash - Coming Soon */}
                    <div className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border text-left opacity-50 cursor-not-allowed relative">
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-body text-sm font-medium">bKash</p>
                          <span className="px-2 py-0.5 rounded-full bg-muted font-body text-[10px] text-muted-foreground">Coming Soon</span>
                        </div>
                        <p className="font-body text-xs text-muted-foreground">Mobile payment via bKash</p>
                      </div>
                    </div>

                    {/* Nagad - Coming Soon */}
                    <div className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border text-left opacity-50 cursor-not-allowed relative">
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-body text-sm font-medium">Nagad</p>
                          <span className="px-2 py-0.5 rounded-full bg-muted font-body text-[10px] text-muted-foreground">Coming Soon</span>
                        </div>
                        <p className="font-body text-xs text-muted-foreground">Mobile payment via Nagad</p>
                      </div>
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
                        <span className="font-body text-sm flex-shrink-0">Tk {(item.quantity * Number(item.product?.price || 0)).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-4 space-y-2 mb-6">
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                      <span>Tk {totalPrice.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Delivery ({insideDhaka ? "Inside Dhaka" : "Outside Dhaka"})</span>
                      <span>Tk {deliveryCharge}</span>
                    </div>
                    <div className="flex justify-between font-display text-xl pt-2 border-t border-border">
                      <span>Total</span>
                      <span className="text-primary">Tk {total.toFixed(0)}</span>
                    </div>
                  </div>
                  <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={loading}>
                    {loading ? "Placing Order..." : "Place Order"}
                  </Button>
                  <p className="font-body text-xs text-muted-foreground text-center mt-3">
                    🏦 Please complete payment before your order is confirmed
                  </p>
                  <div className="mt-4 p-3 bg-muted/50 rounded-xl">
                    <p className="font-body text-xs font-medium text-foreground mb-1">⚠️ Return Policy</p>
                    <p className="font-body text-xs text-muted-foreground leading-relaxed">Returns accepted only for order mismatch or damaged products. Must be checked in front of delivery person. No returns after delivery person leaves.</p>
                  </div>
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
