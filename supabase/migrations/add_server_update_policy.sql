-- Add UPDATE policy for servers
-- Only server owners can update their servers
CREATE POLICY "Server owners can update their servers"
  ON servers FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
