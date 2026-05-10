import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import usePageTitle from "@/hooks/usePageTitle";

const Cart = () => {
  usePageTitle("Your Cart");
  const { items, loading, updateQuantity, removeFromCart, totalPrice, addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Fetch cheap product suggestions not already in cart
  useEffect(() => {
    const fetchSuggestions = async () => {
      const cartProductIds = items.map(i => i.product_id);
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, image_url, stock, categories(name)")
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(20);

      if (data) {
        const filtered = data
          .filter(p => !cartProductIds.includes(p.id))
          .slice(0, 6);
        setSuggestions(filtered);
      }
    };
    fetchSuggestions();
  }, [items]);

  return (
    <div className="min-h-screen overflow-x-hidden w-full">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="font-display text-5xl font-light">Shopping <span className="italic text-gradient-rose">Cart</span></h1>
          </motion.div>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="font-display text-2xl text-muted-foreground mb-6">Your cart is empty</p>
              <Button variant="hero" className="rounded-full" onClick={() => navigate("/shop")}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-10">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4 min-w-0">
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-xl p-4 flex flex-wrap sm:flex-nowrap gap-4 items-center"
                  >
                    <Link to={`/product/${item.product_id}`} className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product?.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="max-h-full object-contain" />
                      ) : (
                        <div className="text-muted-foreground text-xs font-body">No Image</div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.product_id}`}>
                        <h3 className="font-display text-lg truncate hover:text-primary transition-colors">{item.product?.name}</h3>
                      </Link>
                      <p className="font-body text-sm text-primary">Tk {Number(item.product?.price || 0).toFixed(0)}</p>
                    </div>
                    <div className="flex items-center border border-border rounded-full">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:text-primary"><Minus size={14} /></button>
                      <span className="w-8 text-center font-body text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:text-primary"><Plus size={14} /></button>
                    </div>
                    <p className="font-display text-lg sm:w-24 text-right ml-auto sm:ml-0">
                      Tk {(item.quantity * Number(item.product?.price || 0)).toFixed(0)}
                    </p>
                    <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2">
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="glass-card rounded-2xl p-6 sticky top-28">
                  <h3 className="font-display text-xl mb-6">Order Summary</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                      <span>Tk {totalPrice.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="text-muted-foreground">Calculated at checkout</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between font-display text-xl">
                      <span>Total</span>
                      <span className="text-primary">Tk {totalPrice.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-xl px-4 py-2.5 mb-4 text-center">
                    <p className="font-body text-xs text-muted-foreground">🏦 Bank Transfer / Online Payment</p>
                  </div>
                  <Button variant="hero" className="w-full rounded-xl" onClick={() => navigate("/checkout")}>
                    Proceed to Checkout
                  </Button>
                  {!user && (
                    <p className="font-body text-xs text-muted-foreground text-center mt-2">
                      No account needed —{" "}
                      <Link to="/auth" className="text-primary hover:underline">sign in</Link>{" "}
                      to autofill your details
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Product Suggestions */}
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-16"
            >
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={16} className="text-primary" />
                <h2 className="font-display text-2xl">You May Also Like</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {suggestions.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group glass-card rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
                    onClick={() => navigate(`/product/${product.slug}`)}
                  >
                    <div className="aspect-square bg-muted overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={20} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-body text-xs line-clamp-1 mb-1">{product.name}</p>
                      <p className="font-display text-sm text-primary">Tk {Number(product.price).toFixed(0)}</p>
                      <button
                        onClick={e => { e.stopPropagation(); addToCart(product.id); }}
                        disabled={product.stock < 1}
                        className="w-full mt-2 py-1.5 rounded-full bg-primary text-primary-foreground font-body text-[10px] tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {product.stock < 1 ? "Sold Out" : "Add to Cart"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
