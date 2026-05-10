import { useState, useEffect } from "react";
import usePageTitle from "@/hooks/usePageTitle";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Minus, Plus, ArrowLeft, Star, Truck, Shield, RotateCcw, Heart, Play, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  user_id: string;
  created_at: string;
  is_approved: boolean;
}

const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  usePageTitle(product?.name || "Product");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", reviewer_name: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      setProduct(data);
      setLoading(false);
      setSelectedImage(0);
      setShowVideo(false);

      if (data) {
        const { data: revs } = await supabase.from("reviews").select("*").eq("product_id", data.id).order("created_at", { ascending: false });
        setReviews(revs || []);

        if (data.category_id) {
          const { data: related } = await supabase.from("products").select("id, name, slug, price, image_url").eq("category_id", data.category_id).eq("is_active", true).neq("id", data.id).limit(4);
          setRelatedProducts(related || []);
        }
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  const handleSubmitReview = async () => {
    if (!user) { toast({ title: "Please sign in to leave a review", variant: "destructive" }); return; }
    if (!reviewForm.reviewer_name.trim()) { toast({ title: "Please enter your name", variant: "destructive" }); return; }
    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: product.id, user_id: user.id, rating: reviewForm.rating,
      comment: reviewForm.comment || null, reviewer_name: reviewForm.reviewer_name,
    });
    if (error) {
      toast({ title: "Failed to submit review", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted!", description: "Your review will appear after admin approval." });
      setReviewForm({ rating: 5, comment: "", reviewer_name: "" });
      const { data: revs } = await supabase.from("reviews").select("*").eq("product_id", product.id).order("created_at", { ascending: false });
      setReviews(revs || []);
    }
    setSubmittingReview(false);
  };

  const approvedReviews = reviews.filter(r => r.is_approved);
  const pendingUserReviews = reviews.filter(r => !r.is_approved && r.user_id === user?.id);
  const avgRating = approvedReviews.length > 0 ? approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length : 0;

  const images = product ? [product.image_url, ...(product.images || [])].filter(Boolean) : [];
  const videoUrl = product?.video_url;
  const totalMedia = images.length + (videoUrl ? 1 : 0);

  const goNextMedia = () => {
    if (showVideo) { setShowVideo(false); setSelectedImage(0); return; }
    if (selectedImage < images.length - 1) setSelectedImage(s => s + 1);
    else if (videoUrl) setShowVideo(true);
  };

  const goPrevMedia = () => {
    if (showVideo) { setShowVideo(false); setSelectedImage(images.length - 1); return; }
    if (selectedImage > 0) setSelectedImage(s => s - 1);
  };

  if (loading) return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="pt-32 container mx-auto px-6 text-center">
        <div className="animate-pulse">
          <div className="h-96 bg-muted rounded-2xl mb-8 max-w-lg mx-auto" />
          <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4" />
          <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 container mx-auto px-6 text-center">
        <h1 className="font-display text-4xl mb-4">Product Not Found</h1>
        <Link to="/shop" className="text-primary hover:underline font-body">Back to Shop</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <Link to="/shop" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to Shop
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Media Gallery */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Main display */}
              <div className="relative rounded-3xl overflow-hidden bg-cream aspect-square group">
                <AnimatePresence mode="wait">
                  {showVideo && videoUrl ? (
                    <motion.div
                      key="video"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full"
                    >
                      {getYouTubeId(videoUrl) ? (
                        <iframe
                          src={"https://www.youtube.com/embed/" + getYouTubeId(videoUrl) + "?autoplay=1&rel=0"}
                          className="w-full h-full"
                          allowFullScreen
                          allow="autoplay"
                          title="Product video"
                        />
                      ) : videoUrl.match(/\.(gif)$/i) ? (
                        <img src={videoUrl} alt="Product preview" className="w-full h-full object-contain" />
                      ) : (
                        <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" muted loop playsInline />
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`img-${selectedImage}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`w-full h-full flex items-center justify-center p-8 cursor-zoom-in ${zoomed ? "cursor-zoom-out" : ""}`}
                      onClick={() => setZoomed(!zoomed)}
                    >
                      {images.length > 0 ? (
                        <img
                          src={images[selectedImage]}
                          alt={product.name}
                          className={`max-h-full object-contain transition-transform duration-500 ${zoomed ? "scale-150" : ""}`}
                        />
                      ) : (
                        <div className="text-muted-foreground font-body">No Image</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Nav arrows */}
                {totalMedia > 1 && (
                  <>
                    <button
                      onClick={goPrevMedia}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={goNextMedia}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Zoom hint */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center">
                    <ZoomIn size={14} />
                  </div>
                </div>

                {/* Image counter */}
                {totalMedia > 1 && (
                  <div className="absolute bottom-3 right-3 glass-card rounded-full px-3 py-1">
                    <span className="font-body text-xs">
                      {showVideo ? totalMedia : selectedImage + 1} / {totalMedia}
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {totalMedia > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedImage(i); setShowVideo(false); }}
                      className={`w-20 h-20 rounded-xl bg-cream flex-shrink-0 overflow-hidden border-2 transition-all duration-300 ${
                        !showVideo && selectedImage === i ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/40"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                  {videoUrl && (
                    <button
                      onClick={() => setShowVideo(true)}
                      className={`w-20 h-20 rounded-xl bg-cream flex-shrink-0 overflow-hidden border-2 transition-all duration-300 flex items-center justify-center relative ${
                        showVideo ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/40"
                      }`}
                    >
                      {getYouTubeId(videoUrl) ? (
                        <img
                          src={"https://img.youtube.com/vi/" + getYouTubeId(videoUrl) + "/mqdefault.jpg"}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : videoUrl.match(/\.(gif)$/i) ? (
                        <img src={videoUrl} alt="GIF preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-foreground/10 flex items-center justify-center">
                          <Play size={20} className="text-primary" />
                        </div>
                      )}
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6 lg:sticky lg:top-28">
              <div>
                <p className="font-body text-xs tracking-[0.3em] uppercase text-primary mb-3">
                  {product.categories?.name || "Uncategorized"}
                </p>
                <h1 className="font-display text-4xl md:text-5xl font-light mb-4">{product.name}</h1>

                {approvedReviews.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={16} className={i < Math.round(avgRating) ? "fill-primary text-primary" : "text-muted-foreground/30"} />
                      ))}
                    </div>
                    <span className="font-body text-sm text-muted-foreground">
                      {avgRating.toFixed(1)} ({approvedReviews.length} review{approvedReviews.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <span className="font-display text-3xl text-primary">৳{Number(product.price).toFixed(2)}</span>
                  {product.compare_at_price && (
                    <>
                      <span className="font-body text-lg text-muted-foreground line-through">৳{Number(product.compare_at_price).toFixed(2)}</span>
                      <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded-full font-body text-xs">
                        {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              {product.description && (
                <p className="font-body text-muted-foreground leading-relaxed">{product.description}</p>
              )}

              <div className="flex items-center gap-4">
                <p className="font-body text-sm text-muted-foreground">
                  {product.stock > 0 ? (
                    <span className={product.stock <= 5 ? "text-destructive" : ""}>
                      {product.stock <= 5 ? `Only ${product.stock} left!` : `${product.stock} in stock`}
                    </span>
                  ) : "Out of stock"}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-full">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:text-primary transition-colors"><Minus size={16} /></button>
                  <span className="w-12 text-center font-body">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-3 hover:text-primary transition-colors"><Plus size={16} /></button>
                </div>
                <Button variant="hero" size="lg" className="rounded-full flex-1 gap-2" onClick={() => addToCart(product.id, quantity)} disabled={product.stock < 1}>
                  <ShoppingBag size={18} />
                  {product.stock < 1 ? "Out of Stock" : "Add to Cart"}
                </Button>
                <Button variant="outline" size="lg" className="rounded-full" onClick={() => toggleWishlist(product.id)}>
                  <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} className={isInWishlist(product.id) ? "text-destructive" : ""} />
                </Button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="glass-card rounded-xl p-4 text-center">
                  <Truck size={20} className="mx-auto text-primary mb-2" />
                  <p className="font-body text-xs text-muted-foreground">Free Delivery 3000৳+</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <Shield size={20} className="mx-auto text-primary mb-2" />
                  <p className="font-body text-xs text-muted-foreground">100% Authentic</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center cursor-pointer group relative">
                  <RotateCcw size={20} className="mx-auto text-primary mb-2" />
                  <p className="font-body text-xs text-muted-foreground">Return Policy</p>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 glass-card rounded-xl p-3 text-left opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none shadow-lg">
                    <p className="font-body text-xs font-medium text-foreground mb-1">Return Policy</p>
                    <p className="font-body text-xs text-muted-foreground leading-relaxed">Returns accepted only for order mismatch or damaged/broken products. Items must be checked in front of the delivery person at the time of delivery. No returns will be accepted after the delivery person leaves.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Reviews Section */}
          <div className="mt-20">
            <h2 className="font-display text-3xl mb-8">Customer <span className="italic text-gradient-rose">Reviews</span></h2>

            {user && (
              <div className="glass-card rounded-2xl p-6 mb-8">
                <h3 className="font-display text-xl mb-4">Write a Review</h3>
                <div className="space-y-4">
                  <div>
                    <label className="font-body text-xs tracking-widest uppercase text-muted-foreground block mb-1.5">Your Name</label>
                    <Input value={reviewForm.reviewer_name} onChange={e => setReviewForm(f => ({ ...f, reviewer_name: e.target.value }))} placeholder="Your name" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="font-body text-xs tracking-widest uppercase text-muted-foreground block mb-1.5">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setReviewForm(f => ({ ...f, rating: s }))}>
                          <Star size={24} className={s <= reviewForm.rating ? "fill-primary text-primary" : "text-muted-foreground/30"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-xs tracking-widest uppercase text-muted-foreground block mb-1.5">Comment</label>
                    <Textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} placeholder="Share your experience..." className="rounded-xl" rows={3} />
                  </div>
                  <Button onClick={handleSubmitReview} variant="hero" className="rounded-xl" disabled={submittingReview}>
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </div>
            )}

            {!user && (
              <div className="glass-card rounded-2xl p-6 mb-8 text-center">
                <p className="font-body text-muted-foreground">
                  <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to write a review
                </p>
              </div>
            )}

            {pendingUserReviews.length > 0 && (
              <div className="mb-6">
                <p className="font-body text-xs text-muted-foreground mb-3">Your pending reviews:</p>
                {pendingUserReviews.map(review => (
                  <div key={review.id} className="glass-card rounded-xl p-4 mb-2 opacity-60 border-l-4 border-yellow-400">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={12} className={j < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"} />
                        ))}
                      </div>
                      <span className="font-body text-xs text-yellow-600">Awaiting approval</span>
                    </div>
                    {review.comment && <p className="font-body text-sm text-muted-foreground">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}

            {approvedReviews.length === 0 ? (
              <p className="font-body text-muted-foreground text-center py-8">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-4">
                {approvedReviews.map(review => (
                  <div key={review.id} className="glass-card rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-display text-lg">{review.reviewer_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={14} className={j < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"} />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="font-body text-sm text-muted-foreground">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="font-display text-3xl mb-8">You May Also <span className="italic text-gradient-rose">Like</span></h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedProducts.map(rp => (
                  <Link key={rp.id} to={`/product/${rp.slug}`} className="group">
                    <div className="glass-card rounded-2xl p-6 hover:shadow-xl transition-shadow">
                      <div className="rounded-xl bg-cream flex items-center justify-center h-48 mb-4 overflow-hidden">
                        {rp.image_url ? (
                          <img src={rp.image_url} alt={rp.name} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="text-muted-foreground font-body text-sm">No Image</div>
                        )}
                      </div>
                      <h3 className="font-display text-lg group-hover:text-primary transition-colors">{rp.name}</h3>
                      <p className="font-display text-xl text-primary mt-1">৳{Number(rp.price).toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetail;
