# Farcaster SDK + JWT Authentication Guide for Next.js Mini Apps

This guide explains how to implement authentication in a Next.js (TypeScript) mini app using the Farcaster Frame SDK for user sign-in and JWT for session management, as used in Dollarchain.

---

## 1. Install Dependencies

```bash
yarn add @farcaster/frame-sdk jsonwebtoken
```

---

## 2. Farcaster SDK Sign-In Flow

### a. Generate a Nonce
Generate a secure random nonce for each sign-in attempt:
```ts
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
```

### b. Call Farcaster SDK signIn
```ts
import { sdk } from '@farcaster/frame-sdk';

// ...
const nonce = generateNonce();
// @ts-expect-error acceptAuthAddress is supported in SDK >=0.0.39 but not yet in types
const signInResult = await sdk.actions.signIn({ nonce, acceptAuthAddress: true });
const context = await sdk.context;
```
- This triggers the Farcaster authentication flow (e.g., via Warpcast).
- The SDK returns user context: `fid`, `username`, `displayName`, `pfpUrl`, etc.

---

## 3. Store User in Backend (Optional but recommended)
Send a POST request to your backend to save/update the user:
```ts
await fetch('/api/users/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fid: context.user.fid,
    username: context.user.username,
    avatar_url: context.user.pfpUrl,
  }),
});
```

---

## 4. Create JWT Session
Send a POST request to your backend to create a JWT session:
```ts
await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fid: context.user.fid }),
  credentials: 'include',
});
```
On the backend, set a signed JWT cookie:
```ts
import jwt from 'jsonwebtoken';

export function setAuthCookie(res: NextResponse, user: { fid: number }) {
  const token = jwt.sign({ fid: user.fid }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    domain: '.yourdomain.com',
    maxAge: 60 * 60 * 24 * 7,
  });
}
```

---

## 5. Authenticate API Requests
On each API request, read and verify the JWT from the cookie:
```ts
import jwt from 'jsonwebtoken';

export function getServerUser(reqOrCookies: NextRequest | ReadonlyRequestCookies) {
  const token = reqOrCookies.cookies.get('auth_token')?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { fid: number };
    return { fid: payload.fid };
  } catch {
    return null;
  }
}
```

---

## 6. Usage in Next.js Pages/Components
- Use the Farcaster sign-in flow on the client to authenticate users.
- Use the JWT cookie for server-side authentication in API routes and SSR.

---

## 7. Security Notes
- Always use `httpOnly` and `secure` flags for cookies in production.
- Store your JWT secret securely (e.g., in environment variables).
- Never trust user input; always verify JWTs on the server.

---

## 8. References
- [Farcaster Frame SDK](https://github.com/farcasterxyz/frame-sdk)
- [jsonwebtoken npm](https://www.npmjs.com/package/jsonwebtoken)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)

---

**This guide provides a template for secure, modern authentication in Farcaster mini apps. Adapt endpoints and logic as needed for your app's requirements.** 