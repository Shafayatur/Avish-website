import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Heart, Star, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

interface QuickViewProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price?: number | null;
    image_url: string | null;
    description?: string | null;
    stock: number;
    category_name?: string;
  } | null;
  onClose: () => void;
}

const QuickViewModal = ({ product, onClose }: QuickViewProps) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 bg-background rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-destructive/10 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="grid md:grid-cols-2">
            {/* Image */}
            <div className="relative bg-cream p-8 flex items-center justify-center min-h-[300px]">
              {product.image_url ? (
                <motion.img
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                  src={product.image_url}
                  alt={product.name}
                  className="max-h-[350px] object-contain"
                />
              ) : (
                <div className="text-muted-foreground font-body">No Image</div>
              )}
              {product.compare_at_price && (
                <span className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full font-body text-xs tracking-wider">
                  {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-8 flex flex-col justify-center space-y-4">
              {product.category_name && (
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-primary">
                  {product.category_name}
                </p>
              )}
              <h3 className="font-display text-3xl font-light">{product.name}</h3>

              <div className="flex items-center gap-3">
                <span className="font-display text-3xl text-primary">Tk {Number(product.price).toFixed(2)}</span>
                {product.compare_at_price && (
                  <span className="font-body text-lg text-muted-foreground line-through">
                    Tk {Number(product.compare_at_price).toFixed(2)}
                  </span>
                )}
              </div>

              {product.description && (
                <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              )}

              <p className="font-body text-xs text-muted-foreground">
                {product.stock > 0
                  ? product.stock <= 5
                    ? `Only ${product.stock} left in stock!`
                    : `${product.stock} in stock`
                  : "Out of stock"}
              </p>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="hero"
                  className="rounded-full flex-1 gap-2"
                  onClick={() => { addToCart(product.id); onClose(); }}
                  disabled={product.stock < 1}
                >
                  <ShoppingBag size={16} />
                  {product.stock < 1 ? "Out of Stock" : "Add to Cart"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => toggleWishlist(product.id)}
                >
                  <Heart size={16} fill={isInWishlist(product.id) ? "currentColor" : "none"} className={isInWishlist(product.id) ? "text-destructive" : ""} />
                </Button>
              </div>

              <Link
                to={`/product/${product.slug}`}
                onClick={onClose}
                className="inline-flex items-center gap-2 font-body text-xs tracking-widest uppercase text-primary hover:underline pt-2"
              >
                <Eye size={14} /> View Full Details
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickViewModal;
