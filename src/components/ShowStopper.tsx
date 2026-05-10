import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ShoppingBag, ArrowRight, Sparkles, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";

const ShowStopper = () => {
  const [product, setProduct] = useState<any>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, image_url, description, stock")
        .eq("is_show_stopper", true)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      setProduct(data);
    };
    fetchProduct();
  }, []);

  if (!product) return null;

  const features = [
    "Premium quality ingredients",
    "Dermatologically tested",
    "Long-lasting formula",
    "Cruelty-free & vegan",
  ];

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <section
      className="relative w-full overflow-hidden py-14 md:py-20"
      style={{
        background: "linear-gradient(135deg, hsl(35 40% 95%) 0%, hsl(350 40% 92%) 40%, hsl(14 50% 88%) 100%)",
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="font-body text-[10px] tracking-[0.5em] uppercase text-primary/80">
            ✦ Exclusively Curated ✦
          </span>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Left: Product Image */}
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              type: "spring",
              stiffness: 60,
              damping: 14,
              mass: 1,
              delay: 0.2,
            }}
            className="relative flex items-center justify-center"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[80%] h-[80%] rounded-full bg-gradient-to-br from-primary/10 via-accent/5 to-transparent blur-2xl" />
            </div>

            <div className="relative bg-white/40 backdrop-blur-sm rounded-3xl p-6 md:p-10 border border-white/50 shadow-xl">
              {discount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", delay: 1, stiffness: 200 }}
                  className="absolute -top-3 -right-3 z-10 w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                >
                  <span className="text-destructive-foreground text-xs font-bold leading-tight text-center">
                    {discount}%<br />OFF
                  </span>
                </motion.div>
              )}

              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full max-h-[450px] object-contain mx-auto drop-shadow-lg"
                />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground font-body">
                  No Image Available
                </div>
              )}

              <motion.div
                animate={{ y: [-6, 6, -6], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 -left-3 w-10 h-10 rounded-full bg-primary/15 backdrop-blur-sm flex items-center justify-center border border-primary/20"
              >
                <Sparkles size={16} className="text-primary" />
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Product Details */}
          <div className="space-y-5">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground leading-[1.1]"
            >
              {product.name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="font-body text-muted-foreground text-base md:text-lg leading-relaxed max-w-md"
            >
              {product.description ||
                "A premium product handpicked for you. Experience luxury like never before with this exclusive selection."}
            </motion.p>

            {/* Features */}
            <div className="space-y-2.5 py-2">
              {features.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: 1.1 + i * 0.12 }}
                  className="flex items-center gap-3 font-body text-sm text-foreground/80"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-primary" />
                  </span>
                  {feat}
                </motion.div>
              ))}
            </div>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 1.6 }}
              className="flex items-end gap-3 pt-2"
            >
              <span className="font-display text-4xl md:text-5xl text-primary font-light">
                Tk {Number(product.price).toFixed(0)}
              </span>
              {product.compare_at_price && (
                <span className="font-body text-lg text-muted-foreground line-through pb-1">
                  Tk {Number(product.compare_at_price).toFixed(0)}
                </span>
              )}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: "spring", stiffness: 100, delay: 1.8 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <Button
                variant="hero"
                size="lg"
                className="rounded-full gap-3 px-10 py-7 text-sm shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)]"
                onClick={() => addToCart(product.id)}
                disabled={product.stock < 1}
              >
                <ShoppingBag size={18} />
                {product.stock < 1 ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Link to={`/product/${product.slug}`}>
                <Button
                  variant="glass"
                  size="lg"
                  className="rounded-full gap-3 px-8 py-7 text-sm"
                >
                  View Details <ArrowRight size={16} />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowStopper;
