import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Eye, Sparkles, Heart, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuickViewModal from "@/components/QuickViewModal";
import usePageTitle from "@/hooks/usePageTitle";

type SortOption = "newest" | "price-low" | "price-high";

const NewArrivalsPage = () => {
  usePageTitle("New Arrivals");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState<any>(null);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      const [prodRes, catRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, slug, price, compare_at_price, image_url, description, stock, category_id, categories(name)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(40),
        supabase.from("categories").select("id, name").order("name"),
      ]);
      setProducts((prodRes.data || []).map((p: any) => ({ ...p, category_name: p.categories?.name })));
      setCategories(catRes.data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filtered = products
    .filter(p => !selectedCategory || p.category_id === selectedCategory)
    .sort((a, b) => {
      if (sortBy === "price-low") return Number(a.price) - Number(b.price);
      if (sortBy === "price-high") return Number(b.price) - Number(a.price);
      return 0;
    });

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-primary" />
              <p className="font-body text-xs tracking-[0.4em] uppercase text-primary">Just Dropped</p>
              <Sparkles size={14} className="text-primary" />
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-light">
              <span className="text-primary">New</span>{" "}
              <span className="italic text-gradient-rose">Arrivals</span>
            </h1>
            <div className="h-[2px] w-20 bg-primary mx-auto mt-6" />
            <p className="font-body text-sm text-muted-foreground mt-4">
              {filtered.length} products — fresh and just for you
            </p>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center mb-8">
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-nowrap">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="rounded-full font-body text-xs flex-shrink-0"
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="rounded-full font-body text-xs flex-shrink-0"
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <SlidersHorizontal size={14} className="text-muted-foreground" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-body"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="glass-card rounded-3xl p-4 animate-pulse">
                  <div className="bg-muted rounded-2xl aspect-square mb-4" />
                  <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-muted-foreground mb-4">No products found</p>
              <Button variant="hero" className="rounded-full" onClick={() => navigate("/shop")}>
                Browse All Products
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                >
                  <div
                    className="group rounded-3xl overflow-hidden bg-white dark:bg-secondary border border-border shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer"
                    onClick={() => navigate(`/product/${product.slug}`)}
                  >
                    <div className="relative overflow-hidden aspect-square bg-muted">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-5xl text-muted-foreground">{product.name?.charAt(0)}</span>
                        </div>
                      )}

                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <div className="flex gap-2">
                          <button
                            onClick={e => { e.stopPropagation(); setQuickView(product); }}
                            className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); toggleWishlist(product.id); }}
                            className={`w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg ${isInWishlist(product.id) ? "text-destructive" : ""}`}
                          >
                            <Heart size={14} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>

                      {/* Badges */}
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
                      <p className="font-body text-[9px] tracking-[0.3em] uppercase text-primary mb-1">{product.category_name || "New"}</p>
                      <h3 className="font-display text-sm md:text-base line-clamp-1 text-foreground mb-1">{product.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-display text-base text-primary">Tk {Number(product.price).toFixed(0)}</span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="font-body text-xs text-muted-foreground line-through">Tk {Number(product.compare_at_price).toFixed(0)}</span>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); addToCart(product.id); }}
                        disabled={product.stock < 1}
                        className="w-full py-2 rounded-full bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={11} />
                        {product.stock < 1 ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
      {quickView && <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />}
    </div>
  );
};

export default NewArrivalsPage;
