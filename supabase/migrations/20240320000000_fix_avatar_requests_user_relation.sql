-- Add foreign key constraint to link avatar_requests with auth.users
ALTER TABLE avatar_requests
ADD CONSTRAINT avatar_requests_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;