
-- Add is_approved to reviews for admin moderation
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist" ON public.wishlist
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create a function to decrement stock when order is confirmed
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    UPDATE products
    SET stock = stock - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND products.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_stock
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_stock_on_order();

-- Update reviews RLS: public can only see approved reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
  FOR SELECT TO public
  USING (is_approved = true OR auth.uid() = user_id);

-- Admin can manage all reviews
CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add video_url column to products for GIF/video
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url text;
