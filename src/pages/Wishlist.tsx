import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import usePageTitle from "@/hooks/usePageTitle";

const Wishlist = () => {
  usePageTitle("My Wishlist");
  const { items, toggleWishlist, loading } = useWishlist();
  const { addToCart, setSidebarOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleMoveToCart = async (productId: string, wishlistProductId: string) => {
    await addToCart(productId);
    await toggleWishlist(wishlistProductId);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="font-display text-5xl font-light">My <span className="italic text-gradient-rose">Wishlist</span></h1>
            {items.length > 0 && (
              <p className="font-body text-sm text-muted-foreground mt-3">{items.length} item{items.length !== 1 ? "s" : ""} saved</p>
            )}
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
                  <div className="bg-muted rounded-xl h-48 mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Heart size={36} className="text-muted-foreground" />
              </div>
              <p className="font-display text-2xl text-muted-foreground mb-3">Your wishlist is empty</p>
              <p className="font-body text-sm text-muted-foreground mb-8">
                {!user ? "Sign in to save items across devices, or start browsing!" : "Save items you love by clicking the heart icon."}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button variant="hero" className="rounded-full" onClick={() => navigate("/shop")}>
                  Explore Products
                </Button>
                {!user && (
                  <Button variant="outline" className="rounded-full" onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Add all to cart */}
              <div className="flex justify-end mb-6">
                <Button
                  variant="outline"
                  className="rounded-full gap-2 font-body text-xs tracking-widest uppercase"
                  onClick={async () => {
                    for (const item of items) {
                      if (item.product.stock > 0) await addToCart(item.product.id);
                    }
                    setSidebarOpen(true);
                  }}
                >
                  <ShoppingCart size={14} />
                  Add All to Cart
                </Button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <AnimatePresence>
                  {items.map((item, i) => {
                    const discount = item.product.compare_at_price
                      ? Math.round((1 - item.product.price / item.product.compare_at_price) * 100)
                      : 0;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.05 }}
                        layout
                      >
                        <div className="glass-card rounded-2xl overflow-hidden group">
                          {/* Image */}
                          <div className="relative overflow-hidden bg-muted aspect-square">
                            <Link to={`/product/${item.product.slug}`}>
                              {item.product.image_url ? (
                                <img
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-body text-sm">No Image</div>
                              )}
                            </Link>

                            {/* Badges */}
                            {discount > 0 && (
                              <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-body text-[10px]">
                                -{discount}%
                              </span>
                            )}
                            {item.product.stock === 0 && (
                              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                <span className="font-body text-xs text-muted-foreground bg-background px-3 py-1 rounded-full">Sold Out</span>
                              </div>
                            )}

                            {/* Remove button */}
                            <button
                              onClick={() => toggleWishlist(item.product_id)}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Info */}
                          <div className="p-3 md:p-4">
                            <Link to={`/product/${item.product.slug}`}>
                              <h3 className="font-display text-sm md:text-base hover:text-primary transition-colors line-clamp-1 mb-1">
                                {item.product.name}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="font-display text-base text-primary">Tk {Number(item.product.price).toFixed(0)}</span>
                              {item.product.compare_at_price && (
                                <span className="font-body text-xs text-muted-foreground line-through">
                                  Tk {Number(item.product.compare_at_price).toFixed(0)}
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleMoveToCart(item.product.id, item.product_id)}
                                disabled={item.product.stock < 1}
                                className="flex-1 py-2 rounded-full bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <ShoppingBag size={11} />
                                Move to Cart
                              </button>
                              <button
                                onClick={() => toggleWishlist(item.product_id)}
                                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-destructive hover:text-destructive transition-colors flex-shrink-0"
                              >
                                <Heart size={13} className="fill-primary text-primary" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Wishlist;
