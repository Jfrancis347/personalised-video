-- Create video_templates table
CREATE TABLE IF NOT EXISTS public.video_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    avatar_id VARCHAR(100) NOT NULL,
    script TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.video_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own templates"
    ON public.video_templates FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create templates"
    ON public.video_templates FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
    ON public.video_templates FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

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

-- Create indexes
CREATE INDEX idx_video_templates_user_id ON public.video_templates(user_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';