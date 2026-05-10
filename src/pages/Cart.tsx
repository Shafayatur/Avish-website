import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import usePageTitle from "@/hooks/usePageTitle";
const Cart = () => {
  usePageTitle("Your Cart");
  const { items, loading, updateQuantity, removeFromCart, totalPrice } = useCart();
  const { user } = useAuth();
  const shipping = totalPrice >= 500 ? 0 : 60;

  return (
    <div className="min-h-screen">
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
              <Button asChild variant="hero" className="rounded-full">
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4 flex flex-wrap sm:flex-nowrap gap-4 items-center">
                    <div className="w-20 h-20 rounded-lg bg-cream flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product?.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="max-h-full object-contain" />
                      ) : (
                        <div className="text-muted-foreground text-xs font-body">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg truncate">{item.product?.name}</h3>
                      <p className="font-body text-primary">Tk {Number(item.product?.price || 0).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center border border-border rounded-full">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:text-primary"><Minus size={14} /></button>
                      <span className="w-8 text-center font-body text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:text-primary"><Plus size={14} /></button>
                    </div>
                    <p className="font-display text-lg sm:w-24 text-right ml-auto sm:ml-0">Tk {(item.quantity * Number(item.product?.price || 0)).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2">
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <div className="glass-card rounded-2xl p-6 sticky top-28">
                  <h3 className="font-display text-xl mb-6">Order Summary</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>Tk {totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shipping === 0 ? "Free" : `Tk ${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between font-display text-xl">
                      <span>Total</span>
                      <span className="text-primary">Tk {(totalPrice + shipping).toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="font-body text-xs text-muted-foreground mb-4">🏦 Bank Transfer / Online Payment</p>
                  <Button asChild variant="hero" className="w-full rounded-xl">
                    <Link to="/checkout">Proceed to Checkout</Link>
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
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
