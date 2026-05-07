import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import beautyLook1 from "@/assets/beauty-look-1.jpg";
import beautyLook2 from "@/assets/beauty-look-2.jpg";
import beautyLook3 from "@/assets/beauty-look-3.jpg";

const looks = [
  { image: beautyLook1, title: "Golden Hour Glow", tag: "Trending" },
  { image: beautyLook2, title: "Rose Petal Romance", tag: "New" },
  { image: beautyLook3, title: "Natural Radiance", tag: "Classic" },
];

const BeautyInspiration = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <section className="py-16 md:py-20 relative overflow-hidden" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.4em] uppercase text-primary mb-4">
            Get Inspired
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-light">
            Beauty <span className="italic text-gradient-rose">Inspiration</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {looks.map((look, i) => (
            <motion.div
              key={look.title}
              style={{ y: i === 1 ? y1 : i === 2 ? y2 : 0 }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="group cursor-pointer"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[3/4]">
                <img
                  src={look.image}
                  alt={look.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                  width={640}
                  height={800}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="inline-block px-3 py-1 glass-card rounded-full font-body text-[10px] tracking-widest uppercase mb-3">
                    {look.tag}
                  </span>
                  <h3 className="font-display text-2xl text-cream">{look.title}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BeautyInspiration;
