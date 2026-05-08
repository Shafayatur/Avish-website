import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
}

const fallbackColors = [
  "bg-rose-100 dark:bg-rose-900/40",
  "bg-amber-100 dark:bg-amber-900/40",
  "bg-pink-100 dark:bg-pink-900/40",
  "bg-violet-100 dark:bg-violet-900/40",
  "bg-teal-100 dark:bg-teal-900/40",
  "bg-orange-100 dark:bg-orange-900/40",
];

const iconEmojis = ["💄", "✨", "🌸", "💋", "🪞", "🧴"];

const CategoryShowcase = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, image_url, description")
        .order("name");
      setCategories(data || []);
    };
    fetchCats();
  }, []);

  if (categories.length === 0) return null;

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
          <p className="font-body text-xs tracking-[0.4em] uppercase text-primary mb-4">Browse By</p>
          <h2 className="font-display text-4xl md:text-6xl font-light text-foreground">
            Shop by <span className="italic text-primary">Category</span>
          </h2>
          <div className="h-[2px] w-20 bg-primary mx-auto mt-6" />
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            >
              <Link to={`/shop?category=${cat.id}`} className="group block">
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-lg hover:shadow-2xl transition-shadow duration-500"
                >
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full h-full ${fallbackColors[i % fallbackColors.length]} flex flex-col items-center justify-center gap-4`}>
                      <span className="text-7xl">{iconEmojis[i % iconEmojis.length]}</span>
                      <span className="font-display text-3xl text-foreground">{cat.name}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-display text-lg md:text-2xl text-white mb-1">{cat.name}</h3>
                    {cat.description && (
                      <p className="font-body text-sm text-white/70 mb-3 line-clamp-2">{cat.description}</p>
                    )}
                    <span className="inline-flex items-center gap-2 font-body text-xs tracking-widest uppercase text-white/90 group-hover:text-primary transition-colors">
                      Explore <ArrowRight size={14} />
                    </span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
