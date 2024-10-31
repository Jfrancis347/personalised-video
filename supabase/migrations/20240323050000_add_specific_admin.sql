-- First, get the user ID for the specified email
WITH user_id_lookup AS (
  SELECT id 
  FROM auth.users 
  WHERE email = 'jcefrancis+2@gmail.com'
  LIMIT 1
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM user_id_lookup
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';