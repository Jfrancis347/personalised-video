-- First, drop all existing policies and tables to start fresh
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
DROP POLICY IF EXISTS "Admin full access to user_roles" ON user_roles;
DROP TABLE IF EXISTS user_roles;

-- Create user_roles table
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create a basic policy for users to read their own role
CREATE POLICY "Users can read own role"
    ON user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create a policy for admin access based on a direct role check
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

-- Grant necessary permissions
GRANT ALL ON user_roles TO authenticated;

-- Create index for better performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';