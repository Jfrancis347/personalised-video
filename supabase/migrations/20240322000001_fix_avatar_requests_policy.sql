-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own requests" ON avatar_requests;
DROP POLICY IF EXISTS "Users can create requests" ON avatar_requests;
DROP POLICY IF EXISTS "Admin full access" ON avatar_requests;

-- Create new policies without circular references
CREATE POLICY "Users can view own requests"
ON avatar_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests"
ON avatar_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full access"
ON avatar_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';