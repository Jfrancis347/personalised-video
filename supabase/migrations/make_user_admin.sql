-- Replace 'your_email@example.com' with your actual email
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your_email@example.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';