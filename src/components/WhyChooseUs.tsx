import { motion } from "framer-motion";
import { Leaf, Shield, Truck, Sparkles } from "lucide-react";

const features = [
  { icon: Leaf, title: "100% Natural", desc: "Premium ingredients sourced from nature, free from harmful chemicals." },
  { icon: Shield, title: "Quality Assured", desc: "Every product undergoes rigorous quality testing before reaching you." },
  { icon: Truck, title: "Fast Delivery", desc: "Quick and reliable shipping across Bangladesh with order tracking." },
  { icon: Sparkles, title: "Cruelty Free", desc: "Never tested on animals. Beauty that's kind to all living beings." },
];

const WhyChooseUs = () => {
  return (
    <section className="py-10 md:py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-glow opacity-20" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.4em] uppercase text-primary mb-4">Why Us</p>
          <h2 className="font-display text-4xl md:text-6xl font-light">
            Why Choose <span className="italic text-gradient-rose">Avish</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass-card rounded-2xl p-5 md:p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <f.icon size={28} className="text-primary" />
              </div>
              <h3 className="font-display text-xl mb-3">{f.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
