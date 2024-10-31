-- Create storage bucket for avatar videos if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM storage.buckets WHERE id = 'avatar-videos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatar-videos', 'Avatar Videos', true);
  END IF;
END $$;

-- Ensure bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatar-videos';

-- Enable RLS on objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Update storage policies
DO $$
BEGIN
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Users can upload avatar videos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can read their own videos" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can read all videos" ON storage.objects;
    DROP POLICY IF EXISTS "Public can read avatar videos" ON storage.objects;

    -- Create new policies
    CREATE POLICY "Users can upload avatar videos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatar-videos');

    CREATE POLICY "Users can read their own videos"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'avatar-videos');

    CREATE POLICY "Admins can read all videos"
    ON storage.objects FOR ALL TO admin
    USING (bucket_id = 'avatar-videos');

    CREATE POLICY "Public can read avatar videos"
    ON storage.objects FOR SELECT TO anon
    USING (bucket_id = 'avatar-videos');
END $$;