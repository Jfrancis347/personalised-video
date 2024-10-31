-- Drop existing table and recreate with proper schema
DROP TABLE IF EXISTS public.avatar_requests CASCADE;

-- Create avatar_requests table
CREATE TABLE public.avatar_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    video_url TEXT NOT NULL,
    heygen_avatar_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.avatar_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own requests"
    ON public.avatar_requests 
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own requests"
    ON public.avatar_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
    ON public.avatar_requests
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access"
    ON public.avatar_requests
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.avatar_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create indexes
CREATE INDEX idx_avatar_requests_user_id ON public.avatar_requests(user_id);
CREATE INDEX idx_avatar_requests_status ON public.avatar_requests(status);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';