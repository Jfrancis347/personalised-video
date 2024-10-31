-- Create enum for avatar request status
CREATE TYPE avatar_request_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

-- Create table for avatar requests
CREATE TABLE avatar_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status avatar_request_status DEFAULT 'pending',
  video_url TEXT NOT NULL,
  heygen_avatar_id TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE avatar_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own avatar requests"
  ON avatar_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create requests
CREATE POLICY "Users can create avatar requests"
  ON avatar_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_avatar_requests_updated_at
  BEFORE UPDATE ON avatar_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant admin access to avatar_requests
GRANT ALL ON avatar_requests TO authenticated;

-- Admin can view and update all requests
CREATE POLICY "Admins can manage all avatar requests"
  ON avatar_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);