import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Categories = () => {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      setCategories(data || []);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <p className="font-body text-xs tracking-[0.4em] uppercase text-primary mb-4">Browse</p>
            <h1 className="font-display text-5xl md:text-7xl font-light">
              Our <span className="italic text-gradient-rose">Categories</span>
            </h1>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/shop?category=${cat.id}`} className="group block">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-blush flex items-center justify-center">
                        <span className="font-display text-8xl text-primary/20">{cat.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="font-display text-3xl text-cream mb-2">{cat.name}</h3>
                      {cat.description && <p className="font-body text-sm text-cream/70 mb-3">{cat.description}</p>}
                      <span className="inline-flex items-center gap-2 font-body text-xs tracking-widest uppercase text-cream/90 group-hover:text-primary transition-colors">
                        Explore <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Categories;
