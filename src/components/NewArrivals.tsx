import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import QuickViewModal from "./QuickViewModal";

const NewArrivals = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [quickView, setQuickView] = useState<any>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, image_url, description, stock, categories(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8);
      setProducts(
        (data || []).map((p: any) => ({ ...p, category_name: p.categories?.name }))
      );
    };
    fetchProducts();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-10 md:py-16 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-primary" />
            <p className="font-body text-xs tracking-[0.4em] uppercase text-primary">Just Dropped</p>
            <Sparkles size={14} className="text-primary" />
          </div>
          <h2 className="font-display text-5xl md:text-7xl font-light text-foreground">
            <span className="text-primary">New</span>{" "}
            <span className="italic">Arrivals</span>
          </h2>
          <div className="h-[2px] w-20 bg-primary mx-auto mt-6" />
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
            >
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="group rounded-3xl overflow-hidden bg-white dark:bg-secondary border border-border shadow-md hover:shadow-2xl transition-shadow duration-500"
              >
                <Link to={`/product/${product.slug}`} className="block">
                  <div className="relative overflow-hidden aspect-square bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-5xl text-muted-foreground">{product.name?.charAt(0)}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-white/95 dark:bg-secondary/95 backdrop-blur-md hover:bg-primary hover:text-primary-foreground shadow-lg text-foreground w-9 h-9"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickView(product); }}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-white/95 dark:bg-secondary/95 backdrop-blur-md hover:bg-primary hover:text-primary-foreground shadow-lg text-foreground w-9 h-9"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product.id); }}
                          disabled={product.stock < 1}
                        >
                          <ShoppingBag size={14} />
                        </Button>
                      </div>
                    </div>

                    <span className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-body text-[9px] tracking-wider uppercase font-semibold">
                      New
                    </span>

                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-body text-[9px] font-semibold">
                        {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  <div className="p-3 md:p-4">
                    <p className="font-body text-[9px] tracking-[0.3em] uppercase text-primary mb-1">
                      {product.category_name || "New"}
                    </p>
                    <h3 className="font-display text-sm md:text-base hover:text-primary transition-colors line-clamp-1 text-foreground">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1 mb-3">
                      <span className="font-display text-base md:text-lg text-primary">Tk {Number(product.price).toFixed(0)}</span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="font-body text-xs text-muted-foreground line-through">Tk {Number(product.compare_at_price).toFixed(0)}</span>
                      )}
                    </div>
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart(product.id); }}
                      disabled={product.stock < 1}
                      className="w-full py-2 rounded-full bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={12} />
                      {product.stock < 1 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-14"
        >
          <Link to="/shop">
            <Button size="lg" className="rounded-full px-10 font-body text-xs tracking-widest uppercase">
              View All New Arrivals
            </Button>
          </Link>
        </motion.div>
      </div>

      {quickView && <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />}
    </section>
  );
};

export default NewArrivals;
