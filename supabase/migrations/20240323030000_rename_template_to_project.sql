-- First drop existing tables if they exist
DROP TABLE IF EXISTS public.video_generations;
DROP TABLE IF EXISTS public.project_requests;
DROP TABLE IF EXISTS public.template_requests;

-- Create project_requests table
CREATE TABLE public.project_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    avatar_id VARCHAR(100) NOT NULL,
    script TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    heygen_project_id VARCHAR(100),
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create video_generations table with project reference
CREATE TABLE public.video_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES project_requests(id) ON DELETE CASCADE,
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
ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for project_requests
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

-- Create policies for video_generations
CREATE POLICY "Users can view own generations"
    ON public.video_generations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_requests
            WHERE project_requests.id = video_generations.project_id
            AND project_requests.user_id = auth.uid()
            AND project_requests.status = 'completed'
        )
    );

CREATE POLICY "Users can create generations"
    ON public.video_generations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_requests
            WHERE project_requests.id = project_id
            AND project_requests.user_id = auth.uid()
            AND project_requests.status = 'completed'
            AND project_requests.heygen_project_id IS NOT NULL
        )
    );

CREATE POLICY "Users can update own generations"
    ON public.video_generations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_requests
            WHERE project_requests.id = video_generations.project_id
            AND project_requests.user_id = auth.uid()
            AND project_requests.status = 'completed'
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
CREATE INDEX idx_project_requests_user_id ON public.project_requests(user_id);
CREATE INDEX idx_project_requests_status ON public.project_requests(status);
CREATE INDEX idx_video_generations_project_id ON public.video_generations(project_id);
CREATE INDEX idx_video_generations_status ON public.video_generations(status);

-- Grant permissions
GRANT ALL ON public.project_requests TO authenticated;
GRANT ALL ON public.video_generations TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';