-- Create project_requests table
CREATE TABLE IF NOT EXISTS public.project_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    script TEXT NOT NULL,
    video_url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own project requests"
    ON public.project_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create project requests"
    ON public.project_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full access to project requests"
    ON public.project_requests
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create storage bucket for project videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-videos', 'Project Videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create storage policies
CREATE POLICY "Users can upload project videos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'project-videos');

CREATE POLICY "Users can read project videos"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'project-videos');

-- Create indexes
CREATE INDEX idx_project_requests_user_id ON public.project_requests(user_id);
CREATE INDEX idx_project_requests_status ON public.project_requests(status);

-- Grant permissions
GRANT ALL ON public.project_requests TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';