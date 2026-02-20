-- Fix infinite recursion in server_members RLS policy
-- The original policy queried server_members itself, causing infinite recursion

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view members of their servers" ON server_members;

-- Create a SECURITY DEFINER function to break the recursion
-- This function bypasses RLS to check membership
CREATE OR REPLACE FUNCTION is_server_member(server_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM server_members
    WHERE server_id = server_uuid
    AND user_id = user_uuid
  );
$$;

-- Create the new policy that uses the function to avoid recursion
CREATE POLICY "Users can view members of their servers"
  ON server_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_server_member(server_id, auth.uid())
  );
