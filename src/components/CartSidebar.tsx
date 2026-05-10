import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";

const CartSidebar = () => {
  const { items, sidebarOpen, setSidebarOpen, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar — slides from right on desktop, bottom sheet on mobile */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[85vw] sm:w-96 bg-background shadow-2xl flex flex-col pt-16 md:pt-20"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-primary" />
                <h2 className="font-display text-lg">Your Cart</h2>
                {totalItems > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground font-body text-[10px] flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                <X size={15} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingCart size={28} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-display text-lg text-muted-foreground mb-1">Cart is empty</p>
                    <p className="font-body text-xs text-muted-foreground">Add some products to get started</p>
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
                    className="flex gap-3 items-center p-3 glass-card rounded-2xl"
                  >
                    {/* Image */}
                    <Link
                      to={`/product/${item.product_id}`}
                      onClick={() => setSidebarOpen(false)}
                      className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0"
                    >
                      {item.product?.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <ShoppingBag size={16} className="text-muted-foreground" />
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium line-clamp-1">{item.product?.name}</p>
                      <p className="font-display text-sm text-primary mt-0.5">
                        ৳{Number(item.product?.price || 0).toFixed(0)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center border border-border rounded-full">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors">
                            <Minus size={10} />
                          </button>
                          <span className="w-5 text-center font-body text-xs">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors">
                            <Plus size={10} />
                          </button>
                        </div>
                        <span className="font-body text-xs text-muted-foreground">
                          ৳{(item.quantity * Number(item.product?.price || 0)).toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button onClick={() => removeFromCart(item.id)} className="p-1.5 hover:text-destructive transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border px-5 py-4 space-y-3 flex-shrink-0">
                {/* COD notice */}
                <div className="bg-muted/50 rounded-xl px-4 py-2 text-center">
                  <p className="font-body text-xs text-muted-foreground">💰 Cash on Delivery</p>
                </div>

                {/* Total */}
                <div className="flex justify-between font-display text-lg">
                  <span>Subtotal</span>
                  <span className="text-primary">৳{totalPrice.toFixed(0)}</span>
                </div>

                {/* Buttons */}
                <Button
                  variant="hero"
                  className="w-full rounded-full gap-2"
                  onClick={() => { setSidebarOpen(false); navigate("/checkout"); }}
                >
                  Checkout <ArrowRight size={15} />
                </Button>
                <Link to="/cart" onClick={() => setSidebarOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full font-body text-xs tracking-widest uppercase">
                    View Full Cart
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
