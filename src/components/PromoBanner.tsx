import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
}

const PromoBanner = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("banners")
        .select("id, title, subtitle, image_url, link_url")
        .eq("is_active", true)
        .order("sort_order");
      setBanners(data || []);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[current];

  return (
    <section className="py-8 md:py-16 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden min-h-[400px] md:min-h-[500px]">
          {/* Background image with parallax */}
          <AnimatePresence mode="wait">
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0"
            >
              {banner.image_url ? (
                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-hero-gradient" />
              )}
              {/* Multi-layer gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Content */}
          <div className="relative z-10 flex items-center h-full min-h-[400px] md:min-h-[500px] p-8 md:p-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${banner.id}`}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-lg"
              >
                {/* Decorative line */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 60 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="h-[2px] bg-primary mb-6"
                />

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="font-body text-xs tracking-[0.4em] uppercase text-cream/70 mb-4"
                >
                  Special Offer
                </motion.p>

                <h3 className="font-display text-4xl md:text-6xl lg:text-7xl font-light text-cream mb-4 leading-tight">
                  {banner.title}
                </h3>

                {banner.subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="font-body text-sm md:text-base text-cream/80 max-w-md mb-8 leading-relaxed"
                  >
                    {banner.subtitle}
                  </motion.p>
                )}

                {banner.link_url && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Link to={banner.link_url}>
                      <Button variant="hero" size="lg" className="rounded-full gap-3 px-8">
                        Shop Now <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {banners.length > 1 && (
            <>
              {/* Progress dots */}
              <div className="absolute bottom-6 left-8 md:left-16 z-20 flex items-center gap-3">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className="relative h-1 rounded-full overflow-hidden transition-all duration-300"
                    style={{ width: i === current ? 40 : 16 }}
                  >
                    <div className="absolute inset-0 bg-cream/30 rounded-full" />
                    {i === current && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 6, ease: "linear" }}
                        className="absolute inset-0 bg-cream rounded-full origin-left"
                      />
                    )}
                  </button>
                ))}
                <span className="font-body text-xs text-cream/50 ml-3">
                  {String(current + 1).padStart(2, "0")} / {String(banners.length).padStart(2, "0")}
                </span>
              </div>

              {/* Arrow buttons */}
              <div className="absolute bottom-6 right-8 md:right-16 z-20 flex gap-2">
                <button
                  onClick={() => setCurrent(c => (c - 1 + banners.length) % banners.length)}
                  className="w-12 h-12 rounded-full border border-cream/30 flex items-center justify-center text-cream hover:bg-cream/10 transition-all backdrop-blur-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrent(c => (c + 1) % banners.length)}
                  className="w-12 h-12 rounded-full border border-cream/30 flex items-center justify-center text-cream hover:bg-cream/10 transition-all backdrop-blur-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
