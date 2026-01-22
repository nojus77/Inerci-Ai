-- Pending invitations table
CREATE TABLE pending_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'sales',
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Index for faster lookups by email
CREATE INDEX idx_pending_invitations_email ON pending_invitations(email);

-- RLS policies
ALTER TABLE pending_invitations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view pending invitations
CREATE POLICY "Allow authenticated users to view pending invitations"
ON pending_invitations FOR SELECT
TO authenticated
USING (true);

-- Allow admins to insert pending invitations
CREATE POLICY "Allow admins to insert pending invitations"
ON pending_invitations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow admins to delete pending invitations
CREATE POLICY "Allow admins to delete pending invitations"
ON pending_invitations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow admins to update pending invitations
CREATE POLICY "Allow admins to update pending invitations"
ON pending_invitations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Function to clean up expired invitations (optional - can be called via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM pending_invitations WHERE expires_at < NOW();
END;
$$;

-- Function to remove pending invitation when user signs up
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove the pending invitation for this email
  DELETE FROM pending_invitations WHERE email = NEW.email;
  RETURN NEW;
END;
$$;

-- Trigger to clean up pending invitation on user signup
DROP TRIGGER IF EXISTS on_user_created_remove_invitation ON users;
CREATE TRIGGER on_user_created_remove_invitation
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();
