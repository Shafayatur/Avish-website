import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  created_at: string;
}

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, reviewer_name, created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6);
      setReviews(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return null;
  if (reviews.length === 0) return null;

  return (
    <section className="py-32 bg-cream relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-glow rounded-full blur-3xl opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.4em] uppercase text-primary mb-4">Testimonials</p>
          <h2 className="font-display text-4xl md:text-6xl font-light">
            What Our <span className="italic text-gradient-rose">Clients</span> Say
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.slice(0, 3).map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -8 }}
              className="glass-card rounded-2xl p-8"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={16} className={j < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"} />
                ))}
              </div>
              {review.comment && (
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6 italic">
                  "{review.comment}"
                </p>
              )}
              <div>
                <p className="font-display text-lg">{review.reviewer_name}</p>
                <p className="font-body text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
