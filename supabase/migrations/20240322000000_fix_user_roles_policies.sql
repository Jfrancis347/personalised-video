-- First, drop existing policies
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create new, simplified policies without recursion
CREATE POLICY "Users can read their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create admin policy using direct role check
CREATE POLICY "Admins can manage all roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );

-- Update other table policies to use direct role check
ALTER POLICY "Admin full access to requests" ON avatar_requests
  USING ((SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');

ALTER POLICY "Admin full access to template requests" ON template_requests
  USING ((SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');

ALTER POLICY "Admin full access to templates" ON video_templates
  USING ((SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');

ALTER POLICY "Admin full access to generations" ON video_generations
  USING ((SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';