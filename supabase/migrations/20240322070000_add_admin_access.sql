-- Drop existing policies
DROP POLICY IF EXISTS "Admin full access" ON avatar_requests;

-- Create admin policy for avatar requests
CREATE POLICY "Admin full access"
    ON avatar_requests
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND id IN (SELECT user_id FROM user_roles WHERE role = 'admin')
        )
    );

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';