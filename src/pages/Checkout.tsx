import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import { CheckCircle, User, ChevronDown, ChevronUp, ArrowRight, X, Building2, Smartphone, CreditCard } from "lucide-react";
import usePageTitle from "@/hooks/usePageTitle";
import { bdLocations, districts } from "@/data/bd-locations";

type Step = "delivery" | "payment" | "success";
type PaymentMethod = "bank" | "bkash" | "nagad";

const Checkout = () => {
  usePageTitle("Checkout");
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("delivery");
  const [loading, setLoading] = useState(false);
  const [insideDhaka, setInsideDhaka] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({ email: "", password: "" });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [transactionId, setTransactionId] = useState("");
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

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shipping_name || !form.shipping_phone || !form.shipping_address || !form.shipping_district) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod !== "bank" && !transactionId.trim()) {
      toast({ title: "Please enter your transaction ID", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Check stock
    for (const item of items) {
      const { data: product } = await supabase.from("products").select("stock, name").eq("id", item.product_id).single();
      if (!product || product.stock < item.quantity) {
        toast({
          title: "Stock unavailable",
          description: `"${product?.name}" only has ${product?.stock || 0} left. Please update your cart.`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
    }

    const newOrderId = crypto.randomUUID();
    const { error: orderError } = await supabase.from("orders").insert({
      id: newOrderId,
      user_id: user?.id || null,
      total,
      shipping_name: form.shipping_name,
      shipping_address: form.shipping_address,
      shipping_city: form.shipping_district,
      shipping_state: form.shipping_thana || null,
      shipping_zip: null,
      shipping_phone: form.shipping_phone,
      shipping_country: "BD",
      payment_method: paymentMethod,
      notes: `${form.notes || ""}${transactionId ? ` | Transaction ID: ${transactionId}` : ""} | Delivery: ${insideDhaka ? "Inside Dhaka" : "Outside Dhaka"}`.trim(),
      status: "pending",

    });

    if (orderError) {
      toast({ title: "Order failed", description: orderError?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const orderItems = items.map(item => ({
      order_id: newOrderId,
      product_id: item.product_id,
      product_name: item.product?.name || "Unknown",
      product_image: item.product?.image_url || null,
      quantity: item.quantity,
      price: Number(item.product?.price || 0),
    }));

    await supabase.from("order_items").insert(orderItems);

    // Deduct stock
    for (const item of items) {
      const { data: product } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
      if (product) {
        await supabase.from("products").update({ stock: Math.max(0, product.stock - item.quantity) }).eq("id", item.product_id);
      }
    }

    await clearCart();
    setOrderId(newOrderId);
    setStep("success");
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    }
    setCreatingAccount(false);
  };

  if (items.length === 0 && step !== "success") {
    navigate("/cart");
    return null;
  }

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-10">
      {[
        { key: "delivery", label: "Delivery", num: 1 },
        { key: "payment", label: "Payment", num: 2 },
        { key: "success", label: "Confirmed", num: 3 },
      ].map((s, i) => (
        <div key={s.key} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-body text-sm transition-all ${
              step === s.key ? "bg-primary text-primary-foreground" :
              (step === "payment" && s.key === "delivery") || step === "success" ? "bg-primary/20 text-primary" :
              "bg-muted text-muted-foreground"
            }`}>
              {(step === "payment" && s.key === "delivery") || step === "success" && s.key !== "success" ? "✓" : s.num}
            </div>
            <span className={`font-body text-xs tracking-widest uppercase hidden sm:block ${step === s.key ? "text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
          </div>
          {i < 2 && <div className={`w-8 h-[1px] ${step === "payment" || step === "success" ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );

  // Success Screen
  if (step === "success") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-28 pb-20">
          <div className="container mx-auto px-6 max-w-lg">
            <StepIndicator />
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-primary" />
              </div>
              <h1 className="font-display text-4xl mb-3">Order Placed!</h1>
              <p className="font-body text-muted-foreground mb-2">
                Thank you, <span className="text-foreground font-medium">{form.shipping_name}</span>!
              </p>
              <p className="font-body text-sm text-muted-foreground mb-2">
                Order ID: <span className="font-mono text-xs bg-muted px-2 py-1 rounded">#{orderId?.slice(0, 8)}</span>
              </p>
              <p className="font-body text-sm text-muted-foreground mb-8">
                Delivering to <span className="text-foreground">{form.shipping_address}, {form.shipping_thana ? form.shipping_thana + ", " : ""}{form.shipping_district}</span>
              </p>

              {paymentMethod !== "bank" && transactionId && (
                <div className="bg-primary/5 rounded-xl p-4 mb-6 text-left">
                  <p className="font-body text-xs text-muted-foreground">Transaction ID recorded:</p>
                  <p className="font-mono text-sm text-primary mt-1">{transactionId}</p>
                  <p className="font-body text-xs text-muted-foreground mt-2">We'll verify your payment and confirm your order shortly.</p>
                </div>
              )}

              {paymentMethod === "bank" && (
                <div className="bg-primary/5 rounded-xl p-4 mb-6 text-left">
                  <p className="font-body text-xs font-medium text-foreground mb-1">⏳ Awaiting Payment</p>
                  <p className="font-body text-xs text-muted-foreground">Please complete your bank transfer of <span className="text-primary font-medium">Tk {total}</span> to confirm your order.</p>
                </div>
              )}

              {!user && (
                <div className="glass-card rounded-2xl p-5 mb-6 text-left">
                  <button onClick={() => setShowCreateAccount(!showCreateAccount)} className="w-full flex items-center justify-between">
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
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-4 space-y-3">
                          <div>
                            <Label className="font-body text-xs tracking-widest uppercase">Email</Label>
                            <Input type="email" value={accountForm.email} onChange={e => setAccountForm(p => ({ ...p, email: e.target.value }))} className="mt-1 rounded-xl" placeholder="your@email.com" />
                          </div>
                          <div>
                            <Label className="font-body text-xs tracking-widest uppercase">Password</Label>
                            <Input type="password" value={accountForm.password} onChange={e => setAccountForm(p => ({ ...p, password: e.target.value }))} className="mt-1 rounded-xl" placeholder="Min 6 characters" />
                          </div>
                          <Button variant="hero" className="w-full rounded-xl" onClick={handleCreateAccount} disabled={creatingAccount}>
                            {creatingAccount ? "Creating..." : "Create Account"}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => navigate("/shop")}>Continue Shopping</Button>
                {user && <Button variant="hero" className="flex-1 rounded-full" onClick={() => navigate("/orders")}>View Orders</Button>}
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="font-display text-5xl font-light">Check<span className="italic text-gradient-rose">out</span></h1>
          </motion.div>

          <StepIndicator />

          <AnimatePresence mode="wait">

            {/* STEP 1 — Delivery */}
            {step === "delivery" && (
              <motion.div key="delivery" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {!user && (
                  <p className="font-body text-sm text-muted-foreground text-center mb-8">
                    No account needed —{" "}
                    <button onClick={() => navigate("/auth")} className="text-primary hover:underline">sign in</button>
                    {" "}to autofill your details.
                  </p>
                )}
                <form onSubmit={handleDeliverySubmit}>
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
                              {districts.map(d => <option key={d} value={d} />)}
                            </datalist>
                          </div>
                          <div>
                            <Label className="font-body text-xs tracking-widest uppercase">Thana / Upazila</Label>
                            <input
                              list="thanas"
                              value={form.shipping_thana}
                              onChange={e => updateField("shipping_thana", e.target.value)}
                              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="Select or type thana..."
                            />
                            <datalist id="thanas">
                              {(bdLocations[form.shipping_district] || []).map(t => <option key={t} value={t} />)}
                            </datalist>
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="font-body text-xs tracking-widest uppercase">Full Address *</Label>
                            <Input value={form.shipping_address} onChange={e => updateField("shipping_address", e.target.value)} required className="mt-1.5 rounded-xl" placeholder="House No, Road, Area..." />
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="font-body text-xs tracking-widest uppercase">Order Notes (optional)</Label>
                            <Textarea value={form.notes} onChange={e => updateField("notes", e.target.value)} className="mt-1.5 rounded-xl" placeholder="Special delivery instructions..." rows={2} />
                          </div>
                        </div>
                      </div>

                      {/* Delivery Location */}
                      <div className="glass-card rounded-2xl p-6">
                        <h3 className="font-display text-xl mb-4">Delivery Zone</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <button type="button" onClick={() => setInsideDhaka(true)} className={`p-4 rounded-xl border-2 text-left transition-all ${insideDhaka ? "border-primary bg-primary/5" : "border-border"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-3 h-3 rounded-full border-2 ${insideDhaka ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                              <p className="font-body text-sm font-medium">Inside Dhaka</p>
                            </div>
                            <p className="font-display text-lg text-primary">Tk 80</p>
                            <p className="font-body text-xs text-muted-foreground">1-2 days</p>
                          </button>
                          <button type="button" onClick={() => setInsideDhaka(false)} className={`p-4 rounded-xl border-2 text-left transition-all ${!insideDhaka ? "border-primary bg-primary/5" : "border-border"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-3 h-3 rounded-full border-2 ${!insideDhaka ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                              <p className="font-body text-sm font-medium">Outside Dhaka</p>
                            </div>
                            <p className="font-display text-lg text-primary">Tk 150</p>
                            <p className="font-body text-xs text-muted-foreground">2-4 days</p>
                          </button>
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
                                {item.product?.image_url ? <img src={item.product.image_url} alt="" className="w-full h-full object-contain" /> : <span className="text-xs text-muted-foreground">—</span>}
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
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>Tk {totalPrice.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between font-body text-sm">
                            <span className="text-muted-foreground">Delivery</span>
                            <span>Tk {deliveryCharge}</span>
                          </div>
                          <div className="flex justify-between font-display text-xl pt-2 border-t border-border">
                            <span>Total</span>
                            <span className="text-primary">Tk {total.toFixed(0)}</span>
                          </div>
                        </div>
                        <Button type="submit" variant="hero" className="w-full rounded-xl gap-2">
                          Continue to Payment <ArrowRight size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2 — Payment */}
            {step === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <button onClick={() => setStep("delivery")} className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
                  <ArrowRight size={16} className="rotate-180" /> Back to Delivery
                </button>
                <div className="grid lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-6">

                    {/* Payment Methods */}
                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="font-display text-xl mb-6">Select Payment Method</h3>
                      <div className="space-y-3">

                        {/* Bank Transfer */}
                        <button type="button" onClick={() => setPaymentMethod("bank")} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${paymentMethod === "bank" ? "border-primary bg-primary/5" : "border-border"}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === "bank" ? "border-primary" : "border-muted-foreground"}`}>
                            {paymentMethod === "bank" && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <Building2 size={20} className="text-primary flex-shrink-0" />
                          <div>
                            <p className="font-body text-sm font-medium">Bank Transfer</p>
                            <p className="font-body text-xs text-muted-foreground">Transfer to our bank account</p>
                          </div>
                        </button>

                        {/* Bank details */}
                        {paymentMethod === "bank" && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="ml-4 p-4 bg-muted/50 rounded-xl space-y-2 overflow-hidden">
                            <p className="font-body text-xs font-semibold text-foreground mb-3">Transfer Tk {total} to:</p>
                            <div className="grid grid-cols-2 gap-2 font-body text-xs">
                              <span className="text-muted-foreground">Bank</span>
                              <span className="font-medium">YOUR_BANK_NAME</span>
                              <span className="text-muted-foreground">Account Name</span>
                              <span className="font-medium">YOUR_ACCOUNT_NAME</span>
                              <span className="text-muted-foreground">Account No.</span>
                              <span className="font-medium font-mono">YOUR_ACCOUNT_NUMBER</span>
                              <span className="text-muted-foreground">Branch</span>
                              <span className="font-medium">YOUR_BRANCH_NAME</span>
                            </div>
                            <div className="mt-3">
                              <Label className="font-body text-xs tracking-widest uppercase">Transaction ID / Reference (optional)</Label>
                              <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="Enter after transfer" className="mt-1 rounded-xl" />
                            </div>
                          </motion.div>
                        )}

                        {/* bKash - Coming Soon */}
                        <div className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border opacity-50 cursor-not-allowed">
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                          <Smartphone size={20} className="text-pink-500 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-body text-sm font-medium">bKash</p>
                              <span className="px-2 py-0.5 rounded-full bg-muted font-body text-[10px]">Coming Soon</span>
                            </div>
                          </div>
                        </div>

                        {/* Nagad - Coming Soon */}
                        <div className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border opacity-50 cursor-not-allowed">
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                          <CreditCard size={20} className="text-orange-500 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-body text-sm font-medium">Nagad</p>
                              <span className="px-2 py-0.5 rounded-full bg-muted font-body text-[10px]">Coming Soon</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Return Policy */}
                    <div className="glass-card rounded-2xl p-4">
                      <p className="font-body text-xs font-medium text-foreground mb-1">⚠️ Return Policy</p>
                      <p className="font-body text-xs text-muted-foreground leading-relaxed">Returns accepted only for order mismatch or damaged products. Must be checked in front of delivery person. No returns after delivery person leaves.</p>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <div className="glass-card rounded-2xl p-6 sticky top-28">
                      <h3 className="font-display text-xl mb-4">Order Summary</h3>

                      {/* Delivery details */}
                      <div className="bg-muted/30 rounded-xl p-3 mb-4 space-y-1">
                        <p className="font-body text-xs font-medium">📍 {form.shipping_address}</p>
                        <p className="font-body text-xs text-muted-foreground">{form.shipping_thana ? form.shipping_thana + ", " : ""}{form.shipping_district}</p>
                        <p className="font-body text-xs text-muted-foreground">📞 {form.shipping_phone}</p>
                        <button onClick={() => setStep("delivery")} className="font-body text-xs text-primary hover:underline mt-1">Edit</button>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between font-body text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>Tk {totalPrice.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between font-body text-sm">
                          <span className="text-muted-foreground">Delivery</span>
                          <span>Tk {deliveryCharge}</span>
                        </div>
                        <div className="flex justify-between font-display text-xl pt-2 border-t border-border">
                          <span>Total</span>
                          <span className="text-primary">Tk {total.toFixed(0)}</span>
                        </div>
                      </div>

                      <Button
                        variant="hero"
                        className="w-full rounded-xl gap-2"
                        onClick={handlePlaceOrder}
                        disabled={loading}
                      >
                        {loading ? "Placing Order..." : `Place Order — Tk ${total}`}
                      </Button>
                      <p className="font-body text-xs text-muted-foreground text-center mt-3">
                        By placing order you agree to our return policy
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
