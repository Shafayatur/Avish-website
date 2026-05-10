-- Drop old restrictive INSERT policies
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
DROP POLICY IF EXISTS "Allow guest and user order insert" ON orders;
DROP POLICY IF EXISTS "Allow order items insert" ON order_items;

-- New orders INSERT policy: authenticated users with matching user_id OR anon with null user_id
CREATE POLICY "Allow insert orders"
ON orders FOR INSERT
TO authenticated, anon
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- New order_items INSERT policy: allow all inserts
CREATE POLICY "Allow insert order items"
ON order_items FOR INSERT
TO authenticated, anon
WITH CHECK (true);
