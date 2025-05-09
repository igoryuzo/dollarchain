# Dollarchain - A social coordination game

A social coordination game.

## Features

- User authentication with Farcaster
- Push notification functionality via Neynar
- Database integration with Supabase
- Proper manifest configuration
- Simple UI that shows the authenticated user's information

## Getting Started

### Prerequisites

- Node.js 18+ and yarn
- [Supabase](https://supabase.com) account & project
- [Neynar](https://neynar.com) API key for notifications

### Setup Instructions

1. Clone the repository
2. Install dependencies:

```bash
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Neynar API Key for notifications
NEYNAR_API_KEY=your_neynar_api_key

# Application URL (used for notification links)
NEXT_PUBLIC_APP_URL=https://www.dollarchain.xyz
```

4. Create the database schema in Supabase:

```sql
-- Users table
create table users (
  fid bigint primary key,
  username text not null,
  avatar_url text,
  waitlist boolean default false,
  follower_count integer default 0,
  neynar_score decimal(5,2),
  primary_eth_address text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
```