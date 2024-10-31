-- First, drop the existing table and its dependencies
DROP TABLE IF EXISTS avatar_requests CASCADE;

-- Recreate the table with explicit schema reference
CREATE TABLE public.avatar_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    video_url TEXT NOT NULL,
    heygen_avatar_id TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.avatar_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own requests" ON public.avatar_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.avatar_requests;
DROP POLICY IF EXISTS "Admin full access" ON public.avatar_requests;

-- Create policies
CREATE POLICY "Users can view own requests"
    ON public.avatar_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests"
    ON public.avatar_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full access"
    ON public.avatar_requests FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS update_avatar_requests_updated_at ON public.avatar_requests;
CREATE TRIGGER update_avatar_requests_updated_at
    BEFORE UPDATE ON public.avatar_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.avatar_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_avatar_requests_user_id 
    ON public.avatar_requests(user_id);

-- Verify the setup
DO $$
BEGIN
    -- Verify table exists
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'avatar_requests'
    ) THEN
        RAISE EXCEPTION 'Table avatar_requests was not created successfully';
    END IF;

    -- Verify columns exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'avatar_requests'
        AND column_name = 'name'
    ) THEN
        RAISE EXCEPTION 'Column name is missing from avatar_requests';
    END IF;

    -- Verify RLS is enabled
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'avatar_requests'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS is not enabled on avatar_requests';
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';