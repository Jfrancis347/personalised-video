-- Drop existing tables and functions
DROP TABLE IF EXISTS public.avatar_requests CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create avatar_requests table
CREATE TABLE public.avatar_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    video_url TEXT NOT NULL,
    heygen_avatar_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.avatar_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.avatar_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own requests"
    ON public.avatar_requests 
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own requests"
    ON public.avatar_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
    ON public.avatar_requests
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access"
    ON public.avatar_requests
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.avatar_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create indexes
CREATE INDEX idx_avatar_requests_user_id ON public.avatar_requests(user_id);
CREATE INDEX idx_avatar_requests_status ON public.avatar_requests(status);

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-videos', 'Avatar Videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
CREATE POLICY "Users can upload avatar videos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatar-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own videos"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'avatar-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can access all videos"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'avatar-videos' AND
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Verify setup
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