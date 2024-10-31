-- First drop existing policies
DROP POLICY IF EXISTS "Users can view own generations" ON public.video_generations;
DROP POLICY IF EXISTS "Users can create generations" ON public.video_generations;
DROP POLICY IF EXISTS "Admin full access to generations" ON public.video_generations;

-- Create updated policies with proper template ownership checks
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
            AND video_templates.is_active = true
        )
    );

CREATE POLICY "Users can update own generations"
    ON public.video_generations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM video_templates
            WHERE video_templates.id = video_generations.template_id
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

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';