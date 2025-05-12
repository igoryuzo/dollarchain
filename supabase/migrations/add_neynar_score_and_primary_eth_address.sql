-- Add neynar_score and primary_eth_address columns to the users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS neynar_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS primary_eth_address TEXT;
 
-- Create an index on the neynar_score column for faster sorting/filtering
CREATE INDEX IF NOT EXISTS idx_users_neynar_score ON users(neynar_score); 