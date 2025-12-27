-- Create push_tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view/update their own token
CREATE POLICY "Users can manage their own push token"
  ON push_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Coaches can view all tokens (needed to find players to notify?)
-- Actually, strict security: Only system (service role) needs to view others' tokens for sending.
-- But wait, our backend runs as service role often? No, it runs as user usually.
-- Ideally, the backend uses `supabaseAdmin` for notifications so RLS doesn't block it.
-- We'll keep RLS strict: Users effectively only see their own.
-- Service role bypasses RLS.
  