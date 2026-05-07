import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-glow opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="font-body text-xs tracking-[0.4em] uppercase text-primary mb-4">
            Stay Connected
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-light mb-6">
            Join the <span className="italic text-gradient-rose">Avish Lifestyle</span>
          </h2>
          <p className="font-body text-muted-foreground mb-10">
            Subscribe for exclusive launches, beauty tips, and members-only offers.
          </p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-6 py-4 rounded-full glass-card font-body text-sm tracking-wider outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
            />
            <Button variant="hero" size="lg" className="rounded-full px-8">
              Subscribe
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;
