import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-cosmetics.jpg";
import lipstick from "@/assets/lipstick.png";
import brush from "@/assets/brush.png";
import compact from "@/assets/compact.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-hero-gradient overflow-hidden flex items-center">
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-glow rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-glow rounded-full blur-3xl opacity-30" />

      {/* Floating cosmetic items */}
      <motion.img
        src={lipstick}
        alt="Floating lipstick"
        className="absolute top-20 right-[15%] w-24 md:w-32 pointer-events-none"
        animate={{ y: [0, -15, -8, 0], rotate: [0, 2, -1, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        loading="lazy"
        width={512}
        height={768}
      />
      <motion.img
        src={brush}
        alt="Floating brush"
        className="absolute bottom-32 left-[10%] w-20 md:w-28 pointer-events-none"
        animate={{ y: [0, -20, -5, 0], rotate: [0, -3, 2, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        loading="lazy"
        width={512}
        height={768}
      />
      <motion.img
        src={compact}
        alt="Floating compact"
        className="absolute top-1/3 left-[5%] w-16 md:w-24 pointer-events-none hidden md:block"
        animate={{ y: [0, -25, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        loading="lazy"
        width={512}
        height={512}
      />
      <motion.img
        src="/logo.png"
        alt="Avish logo floating"
        className="absolute bottom-24 right-[8%] w-20 md:w-28 pointer-events-none hidden md:block"
        animate={{ y: [0, -18, -6, 0], rotate: [0, -2, 3, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        loading="lazy"
        width={256}
        height={256}
      />

      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center lg:text-left"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4"
          >
            Luxury Lifestyle Collection
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="font-display text-6xl md:text-8xl lg:text-9xl font-light tracking-[0.15em] mb-6"
          >
            <span className="text-gradient-rose">Avish</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="font-display text-xl md:text-2xl italic text-muted-foreground mb-10"
          >
            Beauty in Every Shade.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex gap-4 justify-center lg:justify-start flex-wrap"
          >
            <Link to="/shop">
              <Button variant="hero" size="lg" className="px-12 py-6 rounded-full">
                Shop Now
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={heroImage}
              alt="Avish luxury cosmetics collection"
              className="w-full h-auto object-cover"
              width={1920}
              height={1080}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <div className="w-1 h-3 bg-primary rounded-full" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
