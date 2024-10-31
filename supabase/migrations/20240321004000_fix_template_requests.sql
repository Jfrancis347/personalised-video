-- Drop existing table if exists
DROP TABLE IF EXISTS public.template_requests;

-- Create template_requests table with proper schema
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

-- Enable RLS
ALTER TABLE public.template_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own template requests"
    ON public.template_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create template requests"
    ON public.template_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

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

-- Create indexes
CREATE INDEX idx_template_requests_user_id ON public.template_requests(user_id);
CREATE INDEX idx_template_requests_status ON public.template_requests(status);

-- Grant permissions
GRANT ALL ON public.template_requests TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';