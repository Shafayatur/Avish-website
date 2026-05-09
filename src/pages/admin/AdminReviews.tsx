import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, Check, X, Trash2, CheckCheck } from "lucide-react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { Button } from "@/components/ui/button";
import usePageTitle from "@/hooks/usePageTitle";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  is_approved: boolean;
  created_at: string;
  product_id: string;
  product?: { name: string } | null;
}

const AdminReviews = () => {
  usePageTitle("Admin — Reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: "" });
  const [bulkLoading, setBulkLoading] = useState(false);
  const { toast } = useToast();

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*, products:product_id(name)")
      .order("created_at", { ascending: false });
    setReviews((data as any) || []);
  };

  useEffect(() => { fetchReviews(); }, []);

  const updateApproval = async (id: string, is_approved: boolean) => {
    const { error } = await supabase.from("reviews").update({ is_approved }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: is_approved ? "Review approved" : "Review rejected" }); fetchReviews(); }
  };

  const deleteReview = async () => {
    await supabase.from("reviews").delete().eq("id", deleteModal.id);
    toast({ title: "Review deleted" });
    setDeleteModal({ open: false, id: "" });
    fetchReviews();
  };

  const bulkApproveAll = async () => {
    setBulkLoading(true);
    const pendingIds = reviews.filter(r => !r.is_approved).map(r => r.id);
    if (pendingIds.length === 0) { toast({ title: "No pending reviews" }); setBulkLoading(false); return; }
    await supabase.from("reviews").update({ is_approved: true }).in("id", pendingIds);
    toast({ title: `${pendingIds.length} reviews approved` });
    fetchReviews();
    setBulkLoading(false);
  };

  // Stats
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));
  const pendingCount = reviews.filter(r => !r.is_approved).length;

  const filtered = reviews.filter(r => {
    const matchStatus = filter === "all" || (filter === "pending" ? !r.is_approved : r.is_approved);
    const matchStar = starFilter === null || r.rating === starFilter;
    return matchStatus && matchStar;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display text-xl">Reviews</h3>
          <p className="font-body text-xs text-muted-foreground mt-1">{filtered.length} of {reviews.length} reviews</p>
        </div>
        {pendingCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={bulkApproveAll}
            disabled={bulkLoading}
          >
            <CheckCheck size={14} />
            Approve All Pending ({pendingCount})
          </Button>
        )}
      </div>

      {/* Rating Summary */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <p className="font-display text-4xl text-primary">{avgRating}</p>
            <div className="flex gap-0.5 justify-center mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} className={i < Math.round(Number(avgRating)) ? "fill-primary text-primary" : "text-muted-foreground/30"} />
              ))}
            </div>
            <p className="font-body text-xs text-muted-foreground mt-1">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 min-w-[200px] space-y-1.5">
            {ratingCounts.map(({ star, count, pct }) => (
              <button
                key={star}
                onClick={() => setStarFilter(starFilter === star ? null : star)}
                className={`w-full flex items-center gap-2 group ${starFilter === star ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
              >
                <span className="font-body text-xs w-4">{star}</span>
                <Star size={10} className="fill-primary text-primary flex-shrink-0" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="font-body text-xs text-muted-foreground w-6 text-right">{count}</span>
              </button>
            ))}
          </div>
        </div>
        {starFilter && (
          <button onClick={() => setStarFilter(null)} className="mt-3 font-body text-xs text-primary hover:underline">
            Clear star filter
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved"] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="rounded-full font-body text-xs capitalize"
          >
            {f}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1 bg-yellow-200 text-yellow-800 rounded-full px-1.5 text-[10px]">{pendingCount}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="font-body text-muted-foreground text-center py-8">No reviews found</p>
        ) : filtered.map(review => (
          <div key={review.id} className={`glass-card rounded-xl p-4 ${!review.is_approved ? "border-l-4 border-yellow-400" : "border-l-4 border-transparent"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-display text-lg">{review.reviewer_name}</p>
                  <span className={`px-2 py-0.5 rounded-full font-body text-[10px] ${review.is_approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {review.is_approved ? "Approved" : "Pending"}
                  </span>
                </div>
                <p className="font-body text-xs text-muted-foreground mb-2">
                  {(review as any).products?.name || "Unknown product"} • {new Date(review.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className={j < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"} />
                  ))}
                  <span className="font-body text-xs text-muted-foreground ml-1">{review.rating}/5</span>
                </div>
                {review.comment && (
                  <p className="font-body text-sm text-muted-foreground italic">"{review.comment}"</p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!review.is_approved && (
                  <button onClick={() => updateApproval(review.id, true)} className="p-2 hover:text-green-600 transition-colors" title="Approve">
                    <Check size={16} />
                  </button>
                )}
                {review.is_approved && (
                  <button onClick={() => updateApproval(review.id, false)} className="p-2 hover:text-yellow-600 transition-colors" title="Reject">
                    <X size={16} />
                  </button>
                )}
                <button onClick={() => setDeleteModal({ open: true, id: review.id })} className="p-2 hover:text-destructive transition-colors" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={deleteModal.open}
        title="Delete Review?"
        message="This review will be permanently deleted."
        onConfirm={deleteReview}
        onCancel={() => setDeleteModal({ open: false, id: "" })}
      />
    </div>
  );
};

export default AdminReviews;
