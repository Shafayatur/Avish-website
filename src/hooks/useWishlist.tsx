import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

interface WishlistItem {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    stock: number;
  };
}

interface WishlistContextType {
  items: WishlistItem[];
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWishlist = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("wishlist")
      .select("id, product_id, products:product_id(id, name, slug, price, image_url, stock)")
      .eq("user_id", user.id);
    if (data) {
      setItems(data.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product: item.products,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const isInWishlist = (productId: string) => items.some(i => i.product_id === productId);

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      toast({ title: "Please sign in to save to wishlist", variant: "destructive" });
      return;
    }
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      await supabase.from("wishlist").delete().eq("id", existing.id);
      toast({ title: "Removed from wishlist" });
    } else {
      await supabase.from("wishlist").insert({ user_id: user.id, product_id: productId });
      toast({ title: "Added to wishlist! ❤️" });
    }
    await fetchWishlist();
  };

  return (
    <WishlistContext.Provider value={{ items, loading, isInWishlist, toggleWishlist, totalItems: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
