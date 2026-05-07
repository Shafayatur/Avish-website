import { motion } from "framer-motion";

const Footer = () => {
  const footerLinks = {
    Shop: ["Lips", "Face", "Eyes", "Fragrance", "Tools"],
    Company: ["About Us", "Careers", "Press", "Sustainability"],
    Support: ["FAQ", "Shipping", "Returns", "Contact Us"],
  };

  return (
    <footer className="bg-foreground text-background py-20">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div>
            <h3 className="font-display text-3xl tracking-[0.2em] mb-6">AVISH</h3>
            <p className="font-body text-sm text-background/60 leading-relaxed">
              Avish Lifestyle — premium beauty that celebrates the art of self-expression. Crafted with care, designed for you.
            </p>
            <div className="flex gap-4 mt-8">
              {["Instagram", "Pinterest", "TikTok"].map((social) => (
                <motion.a
                  key={social}
                  href="#"
                  whileHover={{ y: -3 }}
                  className="w-10 h-10 rounded-full border border-background/20 flex items-center justify-center font-body text-xs hover:bg-background hover:text-foreground transition-all duration-300"
                >
                  {social[0]}
                </motion.a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-body text-xs tracking-[0.3em] uppercase mb-6">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="font-body text-sm text-background/60 hover:text-background transition-colors duration-300">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-background/40">
            © 2026 Avish Lifestyle. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((link) => (
              <a key={link} href="#" className="font-body text-xs text-background/40 hover:text-background transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
