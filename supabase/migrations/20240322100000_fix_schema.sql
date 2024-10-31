-- Drop existing tables in correct order
DROP TABLE IF EXISTS public.project_requests;
DROP TABLE IF EXISTS public.video_generations;
DROP TABLE IF EXISTS public.video_templates;
DROP TABLE IF EXISTS public.template_requests;
DROP TABLE IF EXISTS public.avatar_requests;
DROP TABLE IF EXISTS public.user_roles;

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create avatar_requests table
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

-- Create template_requests table
CREATE TABLE public.template_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can read own role"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create policies for avatar_requests
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

-- Create policies for template_requests
CREATE POLICY "Users can view own template requests"
    ON public.template_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create template requests"
    ON public.template_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admin full access to roles"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to requests"
    ON public.avatar_requests
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to template requests"
    ON public.template_requests
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Set up storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-videos', 'Avatar Videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

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
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.avatar_requests TO authenticated;
GRANT ALL ON public.template_requests TO authenticated;

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_avatar_requests_user_id ON public.avatar_requests(user_id);
CREATE INDEX idx_template_requests_user_id ON public.template_requests(user_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';