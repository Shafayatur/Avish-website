import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, User, Heart, Sun, Moon, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useTheme } from "@/hooks/useTheme";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/shop" },
    { label: "New Arrivals", href: "/shop?sort=newest" },
    { label: "Categories", href: "/categories" },
    { label: "About", href: "/#about" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-card py-3" : "py-6"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        <Link to="/" className="font-display text-3xl font-light tracking-[0.3em] text-foreground">
          AVISH
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors duration-300 relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={toggleTheme} className="p-2 hover:text-primary transition-colors duration-300" title="Toggle theme">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <Link to="/wishlist" className="relative p-2 hover:text-primary transition-colors duration-300">
            <Heart size={18} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-body">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link to="/cart" className="relative p-2 hover:text-primary transition-colors duration-300">
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-body">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <Link to="/profile" className="p-2 hover:text-primary transition-colors duration-300">
              <User size={18} />
            </Link>
          ) : (
            <Link to="/auth" className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors px-3 py-2 hidden md:block">
              Sign In
            </Link>
          )}

          <button className="lg:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-card mt-2 mx-4 rounded-lg overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {links.map((link) => (
                <Link key={link.label} to={link.href} onClick={() => setMenuOpen(false)} className="font-body text-sm tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
              <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="font-body text-sm tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors">Wishlist</Link>
              {user ? (
                <>
                  <Link to="/orders" onClick={() => setMenuOpen(false)} className="font-body text-sm tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors">My Orders</Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="font-body text-sm tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors">Profile</Link>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMenuOpen(false)} className="font-body text-sm tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors">Sign In</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
