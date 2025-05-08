-- Create users table with waitlist column and follower_count
CREATE TABLE IF NOT EXISTS users (
  fid bigint PRIMARY KEY,
  username text NOT NULL,
  avatar_url text,
  waitlist boolean DEFAULT false,
  follower_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create an index on the waitlist column for faster querying
CREATE INDEX IF NOT EXISTS idx_users_waitlist ON users(waitlist);

-- Create an index on follower_count for faster sorting
CREATE INDEX IF NOT EXISTS idx_users_follower_count ON users(follower_count);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 