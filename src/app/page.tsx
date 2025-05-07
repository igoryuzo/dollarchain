'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';

type FrameContext = {
  user?: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  client?: {
    clientFid: number;
    added: boolean;
    notificationDetails?: {
      url: string;
      token: string;
    };
  };
  location?: {
    type: string;
    [key: string]: unknown;
  };
};

export default function Home() {
  const [context, setContext] = useState<FrameContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addStatus, setAddStatus] = useState<'pending' | 'added' | 'rejected' | 'error' | null>(null);

  useEffect(() => {
    // 1. Check if we're in a Mini App environment
    sdk.isInMiniApp().then(async (isMiniApp: boolean) => {
      if (!isMiniApp) {
        setIsLoading(false);
        setAddStatus('error');
        return;
      }

      // 2. Get context (includes user, client, etc)
      const ctx = await sdk.context;
      setContext(ctx);

      // 3. If not signed in, prompt sign in (automatic in most clients)
      if (!ctx.user?.fid) {
        // This will be silent in most clients, or prompt if needed
        const nonce = Math.random().toString(36).slice(2, 12);
        await sdk.actions.signIn({ nonce });
        // Refresh context after sign in
        const newCtx = await sdk.context;
        setContext(newCtx);
      }

      // 4. If not added, prompt to add frame (and enable notifications)
      if (!ctx.client?.added) {
        setAddStatus('pending');
        try {
          const result = await sdk.actions.addFrame();
          if (result) {
            setAddStatus('added');
          } else {
            setAddStatus('rejected');
          }
        } catch {
          setAddStatus('error');
        }
      } else {
        setAddStatus('added');
      }

      // 5. Hide splash screen when ready
      await sdk.actions.ready();
      setIsLoading(false);
    });
  }, []);

  // UI
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (addStatus === 'error') {
    return (
      <div>
        <h2>This app must be opened in a Farcaster Mini App environment.</h2>
        <p>Open in Warpcast or a supported Farcaster client.</p>
      </div>
    );
  }

  if (!context?.user?.fid) {
    return <div>Authenticating with Farcaster...</div>;
  }

  return (
    <main>
      <h1>Welcome, {context.user.displayName || context.user.username || `FID ${context.user.fid}`}</h1>
      {addStatus === 'pending' && <div>Prompting to add app to your Farcaster client...</div>}
      {addStatus === 'added' && <div>✅ App is added to your Farcaster client and notifications are enabled!</div>}
      {addStatus === 'rejected' && <div>❌ You rejected adding the app. You can add it later from the app menu.</div>}
      {/* Your app content here */}
    </main>
  );
}
