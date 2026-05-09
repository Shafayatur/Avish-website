import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, Check, X, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { Button } from "@/components/ui/button";

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

import usePageTitle from "@/hooks/usePageTitle";
const AdminReviews = () => {
  usePageTitle("Admin — Reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [deleteModal, setDeleteModal] = useState({ open: false, id: "" });
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
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: is_approved ? "Review approved" : "Review rejected" });
      fetchReviews();
    }
  };

  const deleteReview = async () => {
    await supabase.from("reviews").delete().eq("id", deleteModal.id);
    toast({ title: "Review deleted" });
    setDeleteModal({ open: false, id: "" });
    fetchReviews();
  };

  const filtered = reviews.filter(r => {
    if (filter === "pending") return !r.is_approved;
    if (filter === "approved") return r.is_approved;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.is_approved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl">Reviews ({reviews.length})</h3>
        {pendingCount > 0 && (
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-body text-xs">
            {pendingCount} pending
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "approved"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="rounded-full font-body text-xs capitalize">
            {f}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(review => (
          <div key={review.id} className={`glass-card rounded-xl p-4 ${!review.is_approved ? "border-l-4 border-yellow-400" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-display text-lg">{review.reviewer_name}</p>
                  <span className={`px-2 py-0.5 rounded-full font-body text-[10px] ${review.is_approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {review.is_approved ? "Approved" : "Pending"}
                  </span>
                </div>
                <p className="font-body text-xs text-muted-foreground mb-2">
                  Product: {(review as any).products?.name || "Unknown"} • {new Date(review.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className={j < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"} />
                  ))}
                </div>
                {review.comment && <p className="font-body text-sm text-muted-foreground italic">"{review.comment}"</p>}
              </div>
              <div className="flex gap-1">
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
        {filtered.length === 0 && (
          <p className="font-body text-muted-foreground text-center py-8">No reviews found</p>
        )}
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
