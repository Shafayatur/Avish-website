import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import QuickViewModal from "./QuickViewModal";

const ProductCard = ({ product, index }: { product: any; index: number }) => {
  const [hovered, setHovered] = useState(false);
  const { addToCart } = useCart();

  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
    >
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="group relative rounded-3xl overflow-hidden bg-white dark:bg-secondary border border-border shadow-md hover:shadow-2xl transition-shadow duration-500"
      >
        <Link to={product.slug ? `/product/${product.slug}` : "/shop"} className="block">
          <div className="relative overflow-hidden aspect-square bg-muted">
            {product.image_url ? (
              <motion.img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                animate={{ scale: hovered ? 1.08 : 1 }}
                transition={{ duration: 0.6 }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="font-display text-5xl text-muted-foreground">{product.name?.charAt(0)}</span>
              </div>
            )}

            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />

            <motion.div
              className="absolute bottom-3 left-0 right-0 flex justify-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 20 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); product.onQuickView?.(); }}
                className="w-9 h-9 rounded-full bg-white/95 dark:bg-secondary/95 backdrop-blur-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-lg text-foreground"
              >
                <Eye size={14} />
              </button>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart(product.id); }}
                className="w-9 h-9 rounded-full bg-white/95 dark:bg-secondary/95 backdrop-blur-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-lg text-foreground"
              >
                <ShoppingBag size={14} />
              </button>
            </motion.div>

            {discount > 0 && (
              <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-body text-[9px] font-bold tracking-wider">
                -{discount}%
              </span>
            )}
          </div>

          <div className="p-3 md:p-4">
            <p className="font-body text-[9px] tracking-[0.3em] uppercase text-primary mb-1">
              {product.category_name || "Beauty"}
            </p>
            <h3 className="font-display text-sm md:text-base mb-1.5 line-clamp-1 text-foreground">{product.name}</h3>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-display text-base md:text-lg text-primary">Tk {Number(product.price).toFixed(0)}</span>
              {product.compare_at_price && (
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
  );
};

const FeaturedProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [quickView, setQuickView] = useState<any>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, image_url, description, stock, categories(name)")
        .eq("is_featured", true)
        .eq("is_active", true)
        .limit(4);
      if (data && data.length > 0) {
        setProducts(data.map((p: any) => ({ ...p, category_name: p.categories?.name })));
      }
    };
    fetchProducts();
  }, []);

  if (products.length === 0) return null;

  return (
    <section id="shop" className="py-10 md:py-16 relative">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="font-body text-xs tracking-[0.4em] uppercase text-primary mb-4">
            Curated Selection
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-light text-foreground">
            Featured <span className="italic text-primary">Products</span>
          </h2>
          <div className="h-[2px] w-20 bg-primary mx-auto mt-6" />
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <ProductCard
              key={product.id}
              product={{ ...product, onQuickView: () => setQuickView(product) }}
              index={i}
            />
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
              View All Products
            </Button>
          </Link>
        </motion.div>
      </div>

      {quickView && <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />}
    </section>
  );
};

export default FeaturedProducts;
