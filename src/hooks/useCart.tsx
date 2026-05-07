import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    stock: number;
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = "avish_guest_cart";

interface GuestCartItem {
  product_id: string;
  quantity: number;
}

const getGuestCart = (): GuestCartItem[] => {
  try { return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]"); }
  catch { return []; }
};
const setGuestCart = (items: GuestCartItem[]) => localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
const clearGuestCart = () => localStorage.removeItem(GUEST_CART_KEY);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchGuestCartWithProducts = useCallback(async () => {
    const guestItems = getGuestCart();
    if (guestItems.length === 0) { setItems([]); return; }
    const productIds = guestItems.map(g => g.product_id);
    const { data } = await supabase.from("products").select("id, name, price, image_url, stock").in("id", productIds);
    if (data) {
      setItems(guestItems.map((g, i) => {
        const product = data.find(p => p.id === g.product_id);
        return {
          id: `guest-${i}`,
          product_id: g.product_id,
          quantity: g.quantity,
          product: product || { id: g.product_id, name: "Unknown", price: 0, image_url: null, stock: 0 },
        };
      }).filter(item => item.product.name !== "Unknown"));
    }
  }, []);

  const syncGuestCartToDb = useCallback(async (userId: string) => {
    const guestItems = getGuestCart();
    if (guestItems.length === 0) return;
    for (const item of guestItems) {
      const { data: existing } = await supabase.from("cart_items").select("id, quantity").eq("user_id", userId).eq("product_id", item.product_id).maybeSingle();
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + item.quantity }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({ user_id: userId, product_id: item.product_id, quantity: item.quantity });
      }
    }
    clearGuestCart();
  }, []);

  const fetchDbCart = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("cart_items").select("id, product_id, quantity, products:product_id(id, name, price, image_url, stock)").eq("user_id", user.id);
    if (!error && data) {
      setItems(data.map((item: any) => ({ id: item.id, product_id: item.product_id, quantity: item.quantity, product: item.products })));
    }
    setLoading(false);
  }, [user]);

  const fetchCart = useCallback(async () => {
    if (user) { await fetchDbCart(); } else { await fetchGuestCartWithProducts(); }
  }, [user, fetchDbCart, fetchGuestCartWithProducts]);

  useEffect(() => {
    if (user) { syncGuestCartToDb(user.id).then(() => fetchDbCart()); }
    else { fetchGuestCartWithProducts(); }
  }, [user, syncGuestCartToDb, fetchDbCart, fetchGuestCartWithProducts]);

  const addToCart = async (productId: string, quantity = 1) => {
    // Check stock first
    const { data: product } = await supabase.from("products").select("stock").eq("id", productId).single();
    if (!product) return;

    const currentInCart = items.find(i => i.product_id === productId)?.quantity || 0;
    if (currentInCart + quantity > product.stock) {
      toast({ title: "Not enough stock", description: `Only ${product.stock - currentInCart} more available`, variant: "destructive" });
      return;
    }

    if (user) {
      const existing = items.find(i => i.product_id === productId);
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({ user_id: user.id, product_id: productId, quantity });
      }
      toast({ title: "Added to cart!" });
      await fetchDbCart();
    } else {
      const guest = getGuestCart();
      const existing = guest.find(g => g.product_id === productId);
      if (existing) { existing.quantity += quantity; } else { guest.push({ product_id: productId, quantity }); }
      setGuestCart(guest);
      toast({ title: "Added to cart!" });
      await fetchGuestCartWithProducts();
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (user) {
      await supabase.from("cart_items").delete().eq("id", itemId);
      await fetchDbCart();
    } else {
      const guest = getGuestCart();
      const index = items.findIndex(i => i.id === itemId);
      if (index >= 0) { guest.splice(index, 1); setGuestCart(guest); await fetchGuestCartWithProducts(); }
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(itemId);

    // Check stock
    const item = items.find(i => i.id === itemId);
    if (item && quantity > item.product.stock) {
      toast({ title: "Not enough stock", description: `Only ${item.product.stock} available`, variant: "destructive" });
      return;
    }

    if (user) {
      await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
      await fetchDbCart();
    } else {
      const guest = getGuestCart();
      const index = items.findIndex(i => i.id === itemId);
      if (index >= 0 && guest[index]) { guest[index].quantity = quantity; setGuestCart(guest); await fetchGuestCartWithProducts(); }
    }
  };

  const clearCart = async () => {
    if (user) { await supabase.from("cart_items").delete().eq("user_id", user.id); }
    clearGuestCart();
    setItems([]);
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.quantity * Number(i.product?.price || 0), 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, refreshCart: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
