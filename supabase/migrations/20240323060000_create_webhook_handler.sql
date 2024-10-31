-- Create a function to handle HeyGen webhooks
CREATE OR REPLACE FUNCTION handle_heygen_webhook()
RETURNS trigger AS $$
BEGIN
    -- Update video generation status based on webhook payload
    UPDATE video_generations
    SET 
        status = NEW.status,
        video_url = NEW.video_url,
        error = NEW.error,
        updated_at = NOW()
    WHERE 
        metadata->>'heygen_video_id' = NEW.video_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a table to store webhook events
CREATE TABLE IF NOT EXISTS heygen_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id TEXT NOT NULL,
    status TEXT NOT NULL,
    video_url TEXT,
    error TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to handle webhook events
CREATE TRIGGER on_heygen_webhook_received
    AFTER INSERT ON heygen_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION handle_heygen_webhook();

-- Enable RLS
ALTER TABLE heygen_webhooks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view webhook events
CREATE POLICY "Users can view webhook events"
    ON heygen_webhooks
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow the service role to insert webhook events
CREATE POLICY "Service role can insert webhook events"
    ON heygen_webhooks
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON heygen_webhooks TO authenticated;
GRANT ALL ON heygen_webhooks TO service_role;