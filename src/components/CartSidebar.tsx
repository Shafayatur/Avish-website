import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";

const CartSidebar = () => {
  const { items, sidebarOpen, setSidebarOpen, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();
  const shipping = totalPrice >= 500 ? 0 : 60;

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-primary" />
                <h2 className="font-display text-xl">Your Cart</h2>
                {totalItems > 0 && (
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-body text-xs flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:text-primary transition-colors rounded-full hover:bg-muted"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingCart size={32} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-display text-xl text-muted-foreground mb-2">Your cart is empty</p>
                    <p className="font-body text-sm text-muted-foreground">Add some products to get started</p>
                  </div>
                  <Button
                    variant="hero"
                    className="rounded-full mt-2"
                    onClick={() => { setSidebarOpen(false); navigate("/shop"); }}
                  >
                    Start Shopping
                  </Button>
                </div>
              ) : (
                items.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="flex gap-4 items-center p-3 glass-card rounded-2xl"
                  >
                    {/* Image */}
                    <Link
                      to={`/product/${item.product_id}`}
                      onClick={() => setSidebarOpen(false)}
                      className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0"
                    >
                      {item.product?.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <ShoppingBag size={20} className="text-muted-foreground" />
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.product_id}`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <p className="font-body text-sm font-medium line-clamp-1 hover:text-primary transition-colors">
                          {item.product?.name}
                        </p>
                      </Link>
                      <p className="font-display text-base text-primary mt-0.5">
                        ৳{Number(item.product?.price || 0).toFixed(0)}
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-border rounded-full">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:text-primary transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center font-body text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:text-primary transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="font-body text-xs text-muted-foreground">
                          = ৳{(item.quantity * Number(item.product?.price || 0)).toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border px-6 py-5 space-y-4">
                {/* Shipping notice */}
                {shipping > 0 ? (
                  <div className="bg-muted/50 rounded-xl px-4 py-2.5">
                    <p className="font-body text-xs text-muted-foreground text-center">
                      Add <span className="text-primary font-medium">৳{(500 - totalPrice).toFixed(0)}</span> more for free shipping
                    </p>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((totalPrice / 500) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-primary/10 rounded-xl px-4 py-2.5 text-center">
                    <p className="font-body text-xs text-primary">🎉 You have free shipping!</p>
                  </div>
                )}

                {/* Subtotal */}
                <div className="space-y-2">
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>৳{totalPrice.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? "Free 🎉" : `৳${shipping}`}</span>
                  </div>
                  <div className="flex justify-between font-display text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">৳{(totalPrice + shipping).toFixed(0)}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <Button
                    variant="hero"
                    className="w-full rounded-full gap-2"
                    onClick={() => { setSidebarOpen(false); navigate("/checkout"); }}
                  >
                    Checkout <ArrowRight size={16} />
                  </Button>
                  <Link to="/cart" onClick={() => setSidebarOpen(false)}>
                    <Button variant="outline" className="w-full rounded-full font-body text-xs tracking-widest uppercase">
                      View Full Cart
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
