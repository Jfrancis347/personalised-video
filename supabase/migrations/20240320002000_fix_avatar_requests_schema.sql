-- First, ensure we're in the public schema
SET search_path TO public;

-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS avatar_requests
DROP CONSTRAINT IF EXISTS avatar_requests_user_id_fkey;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own avatar requests" ON avatar_requests;
DROP POLICY IF EXISTS "Users can create avatar requests" ON avatar_requests;
DROP POLICY IF EXISTS "Admins can view all avatar requests" ON avatar_requests;

-- Recreate the table with proper schema reference
CREATE TABLE IF NOT EXISTS public.avatar_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    video_url TEXT NOT NULL,
    heygen_avatar_id TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT avatar_requests_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE avatar_requests ENABLE ROW LEVEL SECURITY;

-- Recreate policies with proper conditions
CREATE POLICY "Users can view their own avatar requests"
ON avatar_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create avatar requests"
ON avatar_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all avatar requests"
ON avatar_requests
FOR ALL
TO admin
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON avatar_requests TO authenticated;
GRANT ALL ON avatar_requests TO admin;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO admin;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO admin;
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO admin;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_avatar_requests_user_id ON avatar_requests(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_avatar_requests_updated_at
    BEFORE UPDATE ON avatar_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the setup
DO $$
BEGIN
    -- Verify foreign key
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'avatar_requests_user_id_fkey'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint was not created successfully';
    END IF;

    -- Verify RLS is enabled
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE tablename = 'avatar_requests'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS is not enabled on avatar_requests table';
    END IF;
END $$;