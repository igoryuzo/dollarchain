'use client';

import { useState, useEffect } from 'react';
import { useProfile, AuthKitProvider, useAutoSignIn } from '@/lib/auth';
import { authKitConfig } from '@/lib/auth';
import { Providers } from './providers';
import { isInIframe, requestStorageAccess, checkLocalStorageAccess } from '@/lib/debug';
import { sdk } from '@farcaster/frame-sdk';

// Define types for the Frame context
interface FrameNotificationDetails {
  url: string;
  token: string;
}

interface LocationContext {
  type: string;
  [key: string]: unknown;
}

interface FrameContext {
  user?: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  client?: {
    clientFid: number;
    added: boolean;
    notificationDetails?: FrameNotificationDetails;
  };
  location?: LocationContext;
}

export default function Home() {
  return (
    <Providers>
      <AuthKitProvider config={authKitConfig}>
        <AppContent />
      </AuthKitProvider>
    </Providers>
  );
}

function AppContent() {
  const { isAuthenticated, profile } = useProfile();
  const { autoSignIn } = useAutoSignIn();
  const [notificationStatus, setNotificationStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [storageAccessStatus, setStorageAccessStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [frameContext, setFrameContext] = useState<FrameContext | null>(null);

  // Check if the user has already added the frame
  const hasAddedFrame = frameContext?.client?.added || false;

  // Effect 1: Check storage access only once on mount
  useEffect(() => {
    async function checkAccess() {
      const inIframe = isInIframe();
      if (inIframe) {
        const hasAccess = await checkLocalStorageAccess();
        if (!hasAccess) {
          const accessGranted = await requestStorageAccess();
          setStorageAccessStatus(accessGranted ? 'granted' : 'denied');
        } else {
          setStorageAccessStatus('granted');
        }
      } else {
        setStorageAccessStatus('granted');
      }
    }
    checkAccess();
  }, []);

  // Effect 2: Only run when storageAccessStatus changes to 'granted'
  useEffect(() => {
    if (storageAccessStatus === 'granted') {
      async function runAuth() {
        try {
          // Get the context
          const context = await sdk.context as FrameContext;
          setFrameContext(context);
          console.log('Frame context:', context);

          await autoSignIn();
          // Hide the splash screen when we're ready
          await sdk.actions.ready();
        } catch (error) {
          console.error("Error initializing app:", error);
          setStorageAccessStatus('denied');
        } finally {
          setIsLoading(false);
        }
      }
      runAuth();
    }
  }, [storageAccessStatus]);

  // Automatically prompt to add frame & notifications after authentication
  useEffect(() => {
    if (isAuthenticated && profile && !hasAddedFrame) {
      handleAddToFrame();
    }
  }, [isAuthenticated, profile, hasAddedFrame]);

  // Authentication status display
  const authStatus = isAuthenticated 
    ? `Logged in as @${profile.username} (FID: ${profile.fid})` 
    : 'Not logged in';

  // Handle add to frame button click
  const handleAddToFrame = async () => {
    try {
      // Use the SDK to prompt the user to add the frame
      const result = await sdk.actions.addFrame();
      console.log('Add frame result:', result);
      
      if (result && 'added' in result && result.added) {
        setNotificationStatus('Frame and notifications added successfully!');
      } else if (result && 'added' in result && !result.added && 'reason' in result) {
        setNotificationStatus(`Failed to add frame: ${result.reason}`);
      } else {
        setNotificationStatus('Frame added successfully!');
      }
    } catch (error) {
      console.error('Error adding frame:', error);
      setNotificationStatus('Failed to add frame and notifications.');
    }
  };

  // Send a test notification
  const sendTestNotificationClick = async () => {
    if (!profile?.fid) {
      setNotificationStatus('You need to sign in first');
      return;
    }

    setNotificationStatus('Sending notification...');
    
    try {
      const result = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fid: profile.fid,
        }),
      });
      
      const data = await result.json();
      
      if (data.success) {
        setNotificationStatus('Test notification sent successfully!');
      } else {
        setNotificationStatus(`Failed to send notification: ${data.message}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setNotificationStatus('Error sending notification');
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-900 text-white">
        <div className="text-2xl">Loading DollarChain...</div>
      </main>
    );
  }

  // If we're denied storage access, show a message and a button to request it
  if (storageAccessStatus === 'denied' && isInIframe()) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-900 text-white">
        <div className="max-w-3xl w-full bg-slate-800 rounded-xl shadow-xl p-8 text-center">
          <h1 className="text-4xl font-bold mb-8">DollarChain</h1>
          <p className="mb-8">This app requires storage access to function properly in Warpcast.</p>
          <button 
            onClick={() => requestStorageAccess().then(result => {
              setStorageAccessStatus(result ? 'granted' : 'denied');
            })}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          >
            Grant Storage Access
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-900 text-white">
      <div className="max-w-3xl w-full bg-slate-800 rounded-xl shadow-xl p-8">
        <h1 className="text-4xl font-bold mb-8 text-center">DollarChain</h1>
        
        <div className="mb-8 p-4 border border-slate-700 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
          <p className="text-slate-300">{authStatus}</p>
          
          {isAuthenticated && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center space-x-4">
                {profile.pfpUrl && (
                  <img 
                    src={profile.pfpUrl} 
                    alt={profile.username} 
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <h3 className="font-medium">{profile.displayName}</h3>
                  <p className="text-sm text-slate-400">@{profile.username}</p>
                </div>
              </div>
              
              {/* Automatically prompt, so only show status */}
              {!hasAddedFrame ? (
                <div className="px-4 py-2 bg-slate-700 rounded-md text-center text-sm">
                  Prompting to add app to your Farcaster client...
                </div>
              ) : (
                <div className="px-4 py-2 bg-slate-700 rounded-md text-center text-sm">
                  ✅ App is added to your Farcaster client
                </div>
              )}
              
              <button 
                onClick={sendTestNotificationClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Send Test Notification
              </button>
            </div>
          )}
        </div>
        
        {notificationStatus && (
          <div className="p-4 bg-slate-700 rounded-lg mb-8">
            <h3 className="font-medium mb-1">Notification Status</h3>
            <p className="text-sm">{notificationStatus}</p>
          </div>
        )}
        
        <div className="text-center text-slate-400 mt-8 text-sm">
          <p>
            Farcaster Mini App Demo with Authentication, Push Notifications and Supabase
          </p>
        </div>
      </div>
    </main>
  );
}
