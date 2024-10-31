INSERT INTO user_roles (user_id, role)
VALUES ('paste-your-uuid-here', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';