import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import usePageTitle from "@/hooks/usePageTitle";

const Categories = () => {
  usePageTitle("Categories");
  const [categories, setCategories] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("products").select("category_id").eq("is_active", true),
      ]);
      setCategories(catRes.data || []);
      const counts: Record<string, number> = {};
      (prodRes.data || []).forEach((p: any) => {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      });
      setProductCounts(counts);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <p className="font-body text-xs tracking-[0.4em] uppercase text-primary mb-4">Browse</p>
            <h1 className="font-display text-5xl md:text-7xl font-light">
              Our <span className="italic text-gradient-rose">Categories</span>
            </h1>
            <p className="font-body text-sm text-muted-foreground mt-4">{categories.length} categories to explore</p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[4/5]" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="font-display text-2xl text-muted-foreground">No categories yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link to={`/shop?category=${cat.id}`} className="group block">
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-blush flex items-center justify-center">
                          <span className="font-display text-8xl text-primary/20">{cat.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

                      {/* Product count badge */}
                      <div className="absolute top-3 right-3">
                        <span className="flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 font-body text-xs">
                          <Package size={10} />
                          {productCounts[cat.id] || 0}
                        </span>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                        <h3 className="font-display text-xl md:text-3xl text-cream mb-1">{cat.name}</h3>
                        {cat.description && (
                          <p className="font-body text-xs md:text-sm text-cream/70 mb-2 line-clamp-1">{cat.description}</p>
                        )}
                        <span className="inline-flex items-center gap-2 font-body text-xs tracking-widest uppercase text-cream/90 group-hover:text-primary transition-colors">
                          Explore <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
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

export default Categories;
