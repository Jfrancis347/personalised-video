-- Verify existing policies and create any missing ones
DO $$
BEGIN
    -- Check and create policy for user uploads if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can upload avatar videos'
    ) THEN
        CREATE POLICY "Users can upload avatar videos"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'avatar-videos' AND
            auth.uid() = (storage.foldername(name))[1]::uuid
        );
    END IF;

    -- Check and create policy for users reading their own videos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can read their own videos'
    ) THEN
        CREATE POLICY "Users can read their own videos"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (
            bucket_id = 'avatar-videos' AND
            auth.uid() = (storage.foldername(name))[1]::uuid
        );
    END IF;

    -- Check and create policy for admin access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Admins can read all videos'
    ) THEN
        CREATE POLICY "Admins can read all videos"
        ON storage.objects
        FOR SELECT
        TO admin
        USING (bucket_id = 'avatar-videos');
    END IF;
END
$$;