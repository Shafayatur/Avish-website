import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useRef } from "react";

const BestSellers = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<any[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, image_url, stock")
        .eq("is_best_seller", true)
        .eq("is_active", true)
        .limit(8);
      if (data && data.length > 0) {
        setProducts(data);
      }
    };
    fetchData();
  }, []);

  if (products.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    }
  };

  return (
    <section className="py-10 md:py-16 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center mb-12"
        >
          <div>
            <p className="font-body text-xs tracking-[0.4em] uppercase text-primary mb-4">Most Loved</p>
            <h2 className="font-display text-4xl md:text-6xl font-light text-foreground">
              Best <span className="italic text-primary">Sellers</span>
            </h2>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => scroll("left")} className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-foreground">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => scroll("right")} className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-foreground">
              <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="min-w-[280px] snap-start"
            >
              <div className="bg-white dark:bg-secondary rounded-2xl p-5 group cursor-pointer hover:shadow-xl transition-shadow duration-300 border border-border shadow-md">
                <Link to={item.slug ? `/product/${item.slug}` : "/shop"}>
                  <div className="bg-muted rounded-xl p-6 flex items-center justify-center h-48 mb-4 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                </Link>
                <h3 className="font-display text-lg text-foreground">{item.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-display text-xl text-primary">Tk {Number(item.price).toFixed(0)}</p>
                  <Button size="sm" className="rounded-full gap-2" onClick={() => addToCart(item.id)}>
                    <ShoppingBag size={14} />
                    Add
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
