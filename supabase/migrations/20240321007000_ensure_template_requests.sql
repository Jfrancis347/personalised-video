-- First, ensure we're in the public schema
SET search_path TO public;

-- Drop the table if it exists to ensure a clean slate
DROP TABLE IF EXISTS template_requests CASCADE;

-- Create the template_requests table
CREATE TABLE template_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    avatar_id VARCHAR(100) NOT NULL,
    script TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    heygen_template_id VARCHAR(100),
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE template_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own template requests" ON template_requests;
DROP POLICY IF EXISTS "Users can create template requests" ON template_requests;
DROP POLICY IF EXISTS "Admin full access to template requests" ON template_requests;

-- Create policies
CREATE POLICY "Users can view own template requests"
    ON template_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create template requests"
    ON template_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full access to template requests"
    ON template_requests FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_template_requests_user_id ON template_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_template_requests_status ON template_requests(status);

-- Grant permissions
GRANT ALL ON template_requests TO authenticated;

-- Verify the setup
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'template_requests'
    ) THEN
        RAISE EXCEPTION 'Table template_requests does not exist';
    END IF;

    -- Check if RLS is enabled
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'template_requests'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS is not enabled on template_requests';
    END IF;

    -- Check if all required columns exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'template_requests'
        AND column_name = ANY(ARRAY[
            'id', 'user_id', 'name', 'avatar_id', 'script',
            'status', 'heygen_template_id', 'error',
            'created_at', 'updated_at'
        ])
    ) THEN
        RAISE EXCEPTION 'Missing required columns in template_requests table';
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';