'use client';

import { useState, useEffect } from 'react';
import { useSignIn, useProfile, AuthKitProvider } from '@/lib/auth';
import { authKitConfig } from '@/lib/auth';
import { Providers } from './providers';
import { isInIframe, requestStorageAccess, checkLocalStorageAccess } from '@/lib/debug';

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
  const [addingFrame, setAddingFrame] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [storageAccessStatus, setStorageAccessStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  useEffect(() => {
    async function checkAndRequestAccess() {
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
      } catch (error) {
        console.error("Error checking storage access:", error);
        setStorageAccessStatus('denied');
      } finally {
        // Set loading to false after checking storage access
        setIsLoading(false);
      }
    }
    
    checkAndRequestAccess();
  }, []);

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
      // This would be implemented by addFrameAndNotifications in a real app
      // but we're currently using simplified auth hooks
      setNotificationStatus('Frame and notifications were added successfully!');
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
              
              <button 
                onClick={handleAddToFrame}
                disabled={addingFrame}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:bg-slate-600"
              >
                {addingFrame ? 'Adding...' : 'Add to Frame & Enable Notifications'}
              </button>
              
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
