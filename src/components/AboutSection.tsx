import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import perfume from "@/assets/perfume.png";

const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-16 md:py-20 relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 right-0 w-96 h-96 bg-glow rounded-full blur-3xl opacity-20" />

      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="relative w-72 h-72 md:w-96 md:h-96 mx-auto">
            <div className="absolute inset-0 rounded-full bg-blush/50" />
            <motion.img
              src={perfume}
              alt="Avish perfume"
              className="relative z-10 w-full h-full object-contain"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              loading="lazy"
              width={512}
              height={768}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p className="font-body text-xs tracking-[0.4em] uppercase text-primary mb-4">
            Our Story
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-light mb-8 leading-tight">
            Where Elegance
            <br />
            <span className="text-gradient-rose italic">Meets Beauty</span>
          </h2>
          <p className="font-body text-muted-foreground leading-relaxed mb-6">
            Born from a passion for timeless beauty, Avish brings you premium cosmetics crafted with
            the finest ingredients. Every product is a celebration of femininity, designed to make
            you feel confident and radiant.
          </p>
          <p className="font-body text-muted-foreground leading-relaxed">
            Our collections blend cutting-edge innovation with luxurious textures, delivering
            flawless results that last. Discover the art of beauty with Avish.
          </p>
          <div className="mt-10 flex gap-12">
            {[
              { number: "200+", label: "Products" },
              { number: "50K+", label: "Happy Clients" },
              { number: "15+", label: "Awards" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-3xl text-primary">{stat.number}</p>
                <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
