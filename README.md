# DollarChain - Farcaster Mini App

A Hello World Farcaster Mini App with authentication, notifications, and Supabase integration.

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
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
```

5. Update the manifest file in `public/.well-known/farcaster.json`:
   - Get your account association details from the [Warpcast tool](https://warpcast.com/~/developers/frames)
   - Set your Neynar app's webhook URL in the `webhookUrl` field
   - Update the image URLs to point to your actual assets

### Development

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

### Production

The app is deployed at [https://www.dollarchain.xyz](https://www.dollarchain.xyz).

### Deployment

1. Deploy the application to your hosting provider (Vercel recommended)
2. Set up the environment variables on your hosting provider
3. Configure your domain to point to the deployed application
4. Test the application to ensure authentication and notifications work properly

## Project Structure

- `src/app/page.tsx` - Main application UI
- `src/lib/auth.ts` - Authentication logic
- `src/lib/supabase.ts` - Supabase client and database helper functions
- `src/lib/notifications.ts` - Notification helper functions
- `src/lib/neynar.ts` - Neynar API client
- `src/app/api/` - API routes for various functionality:
  - `users/save/` - Save user data to Supabase
  - `send-notification/` - Send notifications to users
  - `delete-notification-token/` - Handle notification token deletion
  - `webhook/` - Process webhook events from Farcaster
  - `test-notification/` - Endpoint for testing notifications
- `public/.well-known/farcaster.json` - Farcaster manifest file

## Learn More

- [Farcaster Documentation](https://docs.farcaster.xyz/)
- [Neynar Documentation](https://docs.neynar.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## License

This project is open source and available under the [MIT License](LICENSE).
