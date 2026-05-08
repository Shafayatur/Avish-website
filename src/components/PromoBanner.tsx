import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

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
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

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
    <section ref={sectionRef} className="relative w-full overflow-hidden rounded-3xl mx-auto my-10" style={{ height: "55vh", minHeight: 380, maxWidth: "calc(100% - 3rem)" }}>

      {/* Parallax background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
          style={{ y: imageY }}
        >
          {banner.image_url ? (
            <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover scale-110" />
          ) : (
            <div className="w-full h-full bg-hero-gradient" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

      {/* Animated floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/40"
          style={{
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + i * 0.7,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Animated sparkle icons */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute text-white/20"
          style={{
            right: `${10 + i * 12}%`,
            top: `${15 + i * 20}%`,
          }}
          animate={{
            rotate: [0, 180, 360],
            scale: [0.8, 1.2, 0.8],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeInOut",
          }}
        >
          <Sparkles size={i === 1 ? 24 : 16} />
        </motion.div>
      ))}

      {/* Animated ring */}
      <motion.div
        className="absolute right-[15%] top-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-white/10 hidden md:block"
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[15%] top-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/10 hidden md:block"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.1, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-8 md:px-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${banner.id}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7 }}
              className="max-w-xl"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="font-body text-[10px] uppercase text-white/60 mb-4 tracking-[0.5em]"
              >
                ✦ Special Offer ✦
              </motion.p>

              <h2 className="font-display text-4xl md:text-6xl font-light text-white leading-tight mb-4">
                {banner.title.split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={`inline-block mr-3 ${i % 2 === 1 ? "italic text-primary" : ""}`}
                  >
                    {word}
                  </motion.span>
                ))}
              </h2>

              {banner.subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="font-body text-sm text-white/70 max-w-sm mb-8 leading-relaxed"
                >
                  {banner.subtitle}
                </motion.p>
              )}

              {banner.link_url && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Link to={banner.link_url}>
                    <motion.button
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,1)" }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-3 font-body text-xs tracking-[0.3em] uppercase text-white border border-white/40 px-8 py-3 rounded-full hover:text-foreground transition-all duration-500 backdrop-blur-sm"
                    >
                      Shop Now
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight size={14} />
                      </motion.span>
                    </motion.button>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Multi-banner navigation */}
      {banners.length > 1 && (
        <>
          <div className="absolute bottom-6 right-6 z-20 flex gap-2">
            <button onClick={() => setCurrent(c => (c - 1 + banners.length) % banners.length)} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setCurrent(c => (c + 1) % banners.length)} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all">
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`h-[1px] transition-all duration-500 ${i === current ? "w-8 bg-white" : "w-3 bg-white/30"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default PromoBanner;
