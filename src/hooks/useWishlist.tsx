import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const GUEST_WISHLIST_KEY = "avish_guest_wishlist";

const getGuestWishlist = (): string[] => {
  try { return JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]"); }
  catch { return []; }
};
const setGuestWishlist = (ids: string[]) => localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(ids));

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
    compare_at_price?: number | null;
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

  const fetchDbWishlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("wishlist")
      .select("id, product_id, products:product_id(id, name, slug, price, compare_at_price, image_url, stock)")
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

  const fetchGuestWishlist = useCallback(async () => {
    const ids = getGuestWishlist();
    if (ids.length === 0) { setItems([]); return; }
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, image_url, stock")
      .in("id", ids);
    if (data) {
      setItems(data.map((p: any, i: number) => ({
        id: `guest-wish-${i}`,
        product_id: p.id,
        product: p,
      })));
    }
  }, []);

  const syncGuestWishlistToDb = useCallback(async (userId: string) => {
    const ids = getGuestWishlist();
    if (ids.length === 0) return;
    for (const productId of ids) {
      const { data: existing } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .maybeSingle();
      if (!existing) {
        await supabase.from("wishlist").insert({ user_id: userId, product_id: productId });
      }
    }
    localStorage.removeItem(GUEST_WISHLIST_KEY);
  }, []);

  useEffect(() => {
    if (user) {
      syncGuestWishlistToDb(user.id).then(() => fetchDbWishlist());
    } else {
      fetchGuestWishlist();
    }
  }, [user, fetchDbWishlist, fetchGuestWishlist, syncGuestWishlistToDb]);

  const isInWishlist = (productId: string) => items.some(i => i.product_id === productId);

  const toggleWishlist = async (productId: string) => {
    if (user) {
      const existing = items.find(i => i.product_id === productId);
      if (existing) {
        await supabase.from("wishlist").delete().eq("id", existing.id);
      } else {
        await supabase.from("wishlist").insert({ user_id: user.id, product_id: productId });
      }
      await fetchDbWishlist();
    } else {
      const ids = getGuestWishlist();
      const index = ids.indexOf(productId);
      if (index >= 0) {
        ids.splice(index, 1);
      } else {
        ids.push(productId);
      }
      setGuestWishlist(ids);
      await fetchGuestWishlist();
    }
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
