-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.video_generations;
DROP TABLE IF EXISTS public.video_templates;
DROP TABLE IF EXISTS public.template_requests;

-- Create template_requests table
CREATE TABLE public.template_requests (
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

-- Create video_templates table
CREATE TABLE public.video_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    avatar_id VARCHAR(100) NOT NULL,
    script TEXT NOT NULL,
    heygen_template_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create video_generations table
CREATE TABLE public.video_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES video_templates(id) ON DELETE CASCADE,
    contact_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    video_url TEXT,
    error TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.template_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;

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

-- Create policies for video_generations
CREATE POLICY "Users can view own generations"
    ON public.video_generations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create generations"
    ON public.video_generations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admin full access to template requests"
    ON public.template_requests FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to templates"
    ON public.video_templates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to generations"
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
CREATE INDEX idx_template_requests_user_id ON public.template_requests(user_id);
CREATE INDEX idx_template_requests_status ON public.template_requests(status);
CREATE INDEX idx_video_templates_user_id ON public.video_templates(user_id);
CREATE INDEX idx_video_generations_user_id ON public.video_generations(user_id);
CREATE INDEX idx_video_generations_template_id ON public.video_generations(template_id);

-- Grant permissions
GRANT ALL ON public.template_requests TO authenticated;
GRANT ALL ON public.video_templates TO authenticated;
GRANT ALL ON public.video_generations TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';