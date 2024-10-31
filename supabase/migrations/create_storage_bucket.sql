-- Create storage bucket for avatar videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-videos', 'avatar-videos', true);

-- Set up storage policy to allow authenticated users to upload
CREATE POLICY "Users can upload avatar videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatar-videos' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Allow users to read their own videos
CREATE POLICY "Users can read their own videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatar-videos' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Allow admins to read all videos
CREATE POLICY "Admins can read all videos"
ON storage.objects
FOR SELECT
TO admin
USING (bucket_id = 'avatar-videos');