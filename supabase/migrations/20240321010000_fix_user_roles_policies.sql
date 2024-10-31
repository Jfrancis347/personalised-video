-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Drop and recreate the table to ensure clean state
DROP TABLE IF EXISTS user_roles;

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

-- Create simplified policies without recursion
CREATE POLICY "Users can read their own role"
    ON user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
    ON user_roles
    FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_roles_updated_at();

-- Grant permissions
GRANT ALL ON user_roles TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';