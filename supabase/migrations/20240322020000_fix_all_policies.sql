-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Admin full access" ON user_roles;
DROP POLICY IF EXISTS "Users can view own requests" ON avatar_requests;
DROP POLICY IF EXISTS "Users can create requests" ON avatar_requests;
DROP POLICY IF EXISTS "Admin full access" ON avatar_requests;

-- Create new user_roles policies
CREATE POLICY "Users can read own role"
    ON user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admin full access"
    ON user_roles
    FOR ALL
    TO authenticated
    USING (
        COALESCE(
            (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin',
            FALSE
        )
    );

-- Create new avatar_requests policies
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

CREATE POLICY "Admin full access to requests"
    ON avatar_requests
    FOR ALL
    TO authenticated
    USING (
        COALESCE(
            (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin',
            FALSE
        )
    );

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';