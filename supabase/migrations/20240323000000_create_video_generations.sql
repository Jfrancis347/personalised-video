-- Drop existing table if it exists
DROP TABLE IF EXISTS public.video_generations;

-- Create video_generations table
CREATE TABLE public.video_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own generations"
    ON public.video_generations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM video_templates
            WHERE video_templates.id = video_generations.template_id
            AND video_templates.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create generations"
    ON public.video_generations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM video_templates
            WHERE video_templates.id = template_id
            AND video_templates.user_id = auth.uid()
        )
    );

CREATE POLICY "Admin full access to generations"
    ON public.video_generations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create indexes
CREATE INDEX idx_video_generations_template_id ON public.video_generations(template_id);
CREATE INDEX idx_video_generations_status ON public.video_generations(status);

-- Grant permissions
GRANT ALL ON public.video_generations TO authenticated;