import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import usePageTitle from "@/hooks/usePageTitle";
const Wishlist = () => {
  usePageTitle("My Wishlist");
  const { items, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="font-display text-5xl font-light">My <span className="italic text-gradient-rose">Wishlist</span></h1>
          </motion.div>

          {!user ? (
            <div className="text-center py-20">
              <Heart size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="font-display text-2xl text-muted-foreground mb-6">Sign in to view your wishlist</p>
              <Button asChild variant="hero" className="rounded-full">
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Heart size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="font-display text-2xl text-muted-foreground mb-6">Your wishlist is empty</p>
              <Button asChild variant="hero" className="rounded-full">
                <Link to="/shop">Explore Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {items.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="glass-card rounded-2xl p-6 group">
                    <Link to={`/product/${item.product.slug}`}>
                      <div className="relative overflow-hidden rounded-xl bg-cream mb-6 flex items-center justify-center h-64">
                        {item.product.image_url ? (
                          <img src={item.product.image_url} alt={item.product.name} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="text-muted-foreground font-body text-sm">No Image</div>
                        )}
                      </div>
                    </Link>
                    <h3 className="font-display text-xl mb-2">{item.product.name}</h3>
                    <p className="font-display text-2xl text-primary mb-4">Tk {Number(item.product.price).toFixed(2)}</p>
                    <div className="flex gap-2">
                      <Button variant="hero" size="sm" className="rounded-full flex-1 gap-2" onClick={() => addToCart(item.product.id)} disabled={item.product.stock < 1}>
                        <ShoppingBag size={14} />
                        {item.product.stock < 1 ? "Sold Out" : "Add to Cart"}
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full" onClick={() => toggleWishlist(item.product_id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
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

export default Wishlist;
