-- Drop all existing tables and policies
DROP POLICY IF EXISTS "Admin access to avatar videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatar videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can read avatar videos" ON storage.objects;

DROP TABLE IF EXISTS public.video_generations;
DROP TABLE IF EXISTS public.video_templates;
DROP TABLE IF EXISTS public.template_requests;
DROP TABLE IF EXISTS public.avatar_requests;
DROP TABLE IF EXISTS public.user_roles;

-- Create the minimal tables we need
CREATE TABLE public.avatar_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    video_url TEXT NOT NULL,
    heygen_avatar_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.avatar_requests ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Users can view own requests"
    ON public.avatar_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests"
    ON public.avatar_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Set up storage
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM storage.buckets WHERE id = 'avatar-videos'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatar-videos', 'Avatar Videos', true);
    END IF;
END $$;

-- Create storage policies
CREATE POLICY "Users can upload avatar videos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatar-videos');

CREATE POLICY "Users can read avatar videos"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'avatar-videos');

-- Grant permissions
GRANT ALL ON public.avatar_requests TO authenticated;

-- Create index
CREATE INDEX idx_avatar_requests_user_id ON public.avatar_requests(user_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';