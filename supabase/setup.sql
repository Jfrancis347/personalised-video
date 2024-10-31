-- Drop existing tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS public.video_generations;
DROP TABLE IF EXISTS public.video_templates;
DROP TABLE IF EXISTS public.template_requests;
DROP TABLE IF EXISTS public.avatar_requests;
DROP TABLE IF EXISTS public.user_roles;

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create avatar_requests table
CREATE TABLE public.avatar_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
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
    user_id UUID REFERENCES auth.users(id) NOT NULL,
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

-- Create video_templates table
CREATE TABLE public.video_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_id VARCHAR(100) NOT NULL,
    script TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create video_generations table
CREATE TABLE public.video_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES video_templates(id) NOT NULL,
    contact_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    video_url TEXT,
    error TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for avatar videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-videos', 'Avatar Videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create policies for user_roles
CREATE POLICY "Users can read their own role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create policies for avatar_requests
CREATE POLICY "Users can view own requests"
    ON public.avatar_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests"
    ON public.avatar_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create policies for template_requests
CREATE POLICY "Users can view own template requests"
    ON public.template_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create template requests"
    ON public.template_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create policies for video_templates
CREATE POLICY "Users can view own templates"
    ON public.video_templates FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create templates"
    ON public.video_templates FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create policies for video_generations
CREATE POLICY "Users can view own generations"
    ON public.video_generations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM video_templates
            WHERE video_templates.id = video_generations.template_id
            AND video_templates.user_id = auth.uid()
        )
    );

-- Admin policies for all tables
CREATE POLICY "Admin full access to user_roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to avatar_requests"
    ON public.avatar_requests FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to template_requests"
    ON public.template_requests FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to video_templates"
    ON public.video_templates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to video_generations"
    ON public.video_generations FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_avatar_requests_user_id ON public.avatar_requests(user_id);
CREATE INDEX idx_template_requests_user_id ON public.template_requests(user_id);
CREATE INDEX idx_video_templates_user_id ON public.video_templates(user_id);
CREATE INDEX idx_video_generations_template_id ON public.video_generations(template_id);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;