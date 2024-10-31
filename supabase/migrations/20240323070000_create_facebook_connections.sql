-- Create facebook_connections table
CREATE TABLE public.facebook_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.facebook_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own connection"
    ON public.facebook_connections
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create/update own connection"
    ON public.facebook_connections
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_facebook_connections_user_id ON public.facebook_connections(user_id);

-- Grant permissions
GRANT ALL ON public.facebook_connections TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';