'use client';

import { useState, useEffect } from 'react';
import { useSignIn, useProfile, AuthKitProvider, useAutoSignIn } from '@/lib/auth';
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
  const { signIn } = useSignIn({ nonce: undefined });
  const { isAuthenticated, profile } = useProfile();
  const { autoSignIn } = useAutoSignIn();
  const [addingFrame, setAddingFrame] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [storageAccessStatus, setStorageAccessStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [frameContext, setFrameContext] = useState<FrameContext | null>(null);

  useEffect(() => {
    async function initApp() {
      try {
        // Check if we're in an iframe
        const inIframe = isInIframe();
        
        if (inIframe) {
          // Check if we have storage access
          const hasAccess = await checkLocalStorageAccess();
          
          if (!hasAccess) {
            // Try to request storage access
            const accessGranted = await requestStorageAccess();
            setStorageAccessStatus(accessGranted ? 'granted' : 'denied');
          } else {
            setStorageAccessStatus('granted');
          }
        } else {
          // Not in iframe, we should have access
          setStorageAccessStatus('granted');
        }

        // Get the context
        const context = sdk.context as FrameContext;
        setFrameContext(context);
        console.log('Frame context:', context);

        // Attempt automatic sign-in if we have storage access
        if (storageAccessStatus === 'granted') {
          await autoSignIn();
        }
        
        // Hide the splash screen when we're ready
        await sdk.actions.ready();
      } catch (error) {
        console.error("Error initializing app:", error);
        setStorageAccessStatus('denied');
      } finally {
        // Set loading to false after initialization
        setIsLoading(false);
      }
    }
    
    initApp();
  }, [autoSignIn, storageAccessStatus]);

  // Authentication status display
  const authStatus = isAuthenticated 
    ? `Logged in as @${profile.username} (FID: ${profile.fid})` 
    : 'Not logged in';

  // Handle sign-in button click
  const handleSignIn = () => {
    signIn();
  };

  // Handle add to frame button click
  const handleAddToFrame = async () => {
    setAddingFrame(true);
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
    } finally {
      setAddingFrame(false);
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

  // Check if the user has already added the frame
  const hasAddedFrame = frameContext?.client?.added || false;

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
          
          {!isAuthenticated ? (
            <button 
              onClick={handleSignIn}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
            >
              Sign in with Farcaster
            </button>
          ) : (
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
              
              {!hasAddedFrame ? (
                <button 
                  onClick={handleAddToFrame}
                  disabled={addingFrame}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:bg-slate-600"
                >
                  {addingFrame ? 'Adding...' : 'Add to Frame & Enable Notifications'}
                </button>
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
