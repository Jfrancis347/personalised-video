-- Replace with your user ID from auth.users
INSERT INTO user_roles (user_id, role)
VALUES ('28c45719-7316-4116-8cc8-98286e881d32', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';