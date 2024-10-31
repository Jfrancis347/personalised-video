-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own generations" ON public.video_generations;
DROP POLICY IF EXISTS "Users can create generations" ON public.video_generations;
DROP POLICY IF EXISTS "Users can update own generations" ON public.video_generations;
DROP POLICY IF EXISTS "Admin full access to generations" ON public.video_generations;

-- Create updated policies for template requests
CREATE POLICY "Users can view own generations"
    ON public.video_generations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM template_requests
            WHERE template_requests.id = video_generations.template_id
            AND template_requests.user_id = auth.uid()
            AND template_requests.status = 'completed'
        )
    );

CREATE POLICY "Users can create generations"
    ON public.video_generations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM template_requests
            WHERE template_requests.id = template_id
            AND template_requests.user_id = auth.uid()
            AND template_requests.status = 'completed'
            AND template_requests.heygen_template_id IS NOT NULL
        )
    );

CREATE POLICY "Users can update own generations"
    ON public.video_generations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM template_requests
            WHERE template_requests.id = video_generations.template_id
            AND template_requests.user_id = auth.uid()
            AND template_requests.status = 'completed'
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