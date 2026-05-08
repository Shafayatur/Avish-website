import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Search, Heart, SlidersHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuickViewModal from "@/components/QuickViewModal";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  description: string | null;
  category_id: string | null;
  is_featured: boolean;
  stock: number;
  categories?: { name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

type SortOption = "newest" | "price-low" | "price-high" | "name";

import usePageTitle from "@/hooks/usePageTitle";
const Shop = () => {
  usePageTitle("Shop — Our Collection");
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get("category"));
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get("sort") as SortOption) || "newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);
  const [quickView, setQuickView] = useState<any>(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("*, categories(name, slug)").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);
      if (prodRes.data) setProducts(prodRes.data as any);
      if (catRes.data) setCategories(catRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = products
    .filter(p => {
      const matchCat = !selectedCategory || p.category_id === selectedCategory;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchPrice = Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1];
      return matchCat && matchSearch && matchPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low": return Number(a.price) - Number(b.price);
        case "price-high": return Number(b.price) - Number(a.price);
        case "name": return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <p className="font-body text-xs tracking-[0.4em] uppercase text-primary mb-4">Browse</p>
            <h1 className="font-display text-5xl md:text-7xl font-light">Our <span className="italic text-gradient-rose">Collection</span></h1>
          </motion.div>

          {/* Filters Bar */}
          <div className="flex flex-col gap-4 mb-10">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button variant={!selectedCategory ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)} className="rounded-full font-body text-xs tracking-wider flex-shrink-0">
                  All
                </Button>
                {categories.map(cat => (
                  <Button key={cat.id} variant={selectedCategory === cat.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.id)} className="rounded-full font-body text-xs tracking-wider">
                    {cat.name}
                  </Button>
                ))}
              </div>
              <div className="flex gap-3 items-center">
                <div className="relative w-full md:w-56">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-10 rounded-full" />
                </div>
                <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => setShowFilters(!showFilters)}>
                  <SlidersHorizontal size={14} /> Filter
                </Button>
              </div>
            </div>

            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card rounded-2xl p-6">
                <div className="grid sm:grid-cols-3 gap-6">
                  <div>
                    <label className="font-body text-xs tracking-widest uppercase text-muted-foreground block mb-2">Sort By</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-body">
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Name: A-Z</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-xs tracking-widest uppercase text-muted-foreground block mb-2">Min Price (৳)</label>
                    <Input type="number" value={priceRange[0]} onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="font-body text-xs tracking-widest uppercase text-muted-foreground block mb-2">Max Price (৳)</label>
                    <Input type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])} className="rounded-xl" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <p className="font-body text-xs text-muted-foreground mb-6">{filtered.length} product{filtered.length !== 1 ? "s" : ""} found</p>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                  <div className="bg-muted rounded-xl h-64 mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filtered.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="group glass-card rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-500" onClick={() => navigate(`/product/${product.slug}`)}>
                    <div className="relative overflow-hidden bg-cream aspect-square sm:aspect-[3/4]">
                      <Link to={`/product/${product.slug}`}>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-body text-sm">No Image</div>
                        )}
                      </Link>
                      {product.compare_at_price && (
                        <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-2 py-1 rounded-full font-body text-[10px] tracking-wider">SALE</span>
                      )}

                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300 flex items-center justify-center">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                          <button
                            onClick={e => { e.preventDefault(); setQuickView({ ...product, category_name: (product.categories as any)?.name }); }}
                            className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center hover:bg-background transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={e => { e.preventDefault(); toggleWishlist(product.id); }}
                            className={`w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center hover:bg-background transition-colors ${isInWishlist(product.id) ? "text-destructive" : ""}`}
                          >
                            <Heart size={16} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                          </button>
                          <button
                            onClick={e => { e.preventDefault(); addToCart(product.id); }}
                            className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center hover:bg-background transition-colors"
                            disabled={product.stock < 1}
                          >
                            <ShoppingBag size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-body text-[10px] tracking-[0.3em] uppercase text-primary mb-1">
                        {(product.categories as any)?.name || "Uncategorized"}
                      </p>
                      <Link to={`/product/${product.slug}`}>
                        <h3 className="font-display text-base md:text-lg mb-1 hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                      </Link>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-display text-lg text-primary">৳{Number(product.price).toFixed(0)}</span>
                        {product.compare_at_price && (
                          <span className="font-body text-xs text-muted-foreground line-through">৳{Number(product.compare_at_price).toFixed(0)}</span>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); addToCart(product.id); }}
                        disabled={product.stock < 1}
                        className="w-full py-2 rounded-full bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={12} />
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

export default Shop;
