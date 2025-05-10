/**
 * This is a client component where the main application UI is defined.
 * It handles user authentication, app status, and notification permissions.
 */

"use client";

import { useState, useEffect } from 'react';
import { 
  signIn, 
  getUser, 
  isSignedIn, 
  AuthUser, 
  promptAddFrameAndNotifications,
  sendWelcomeNotification,
  requestNotificationPermissions
} from '@/lib/auth';
import { NeynarUser } from '@/lib/neynar';
import { sdk } from '@farcaster/frame-sdk';
import DepositButton from './components/DepositButton';
import WaitlistUsers from './components/WaitlistUsers';
import WaitlistCounter from './components/WaitlistCounter';
import GameBanner from './components/GameBanner';

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);
  const [refreshWaitlist, setRefreshWaitlist] = useState(0); // For triggering waitlist refresh

  // Function to handle notification request
  const handleRequestNotifications = async () => {
    if (!user || isRequestingNotifications) return;
    
    setIsRequestingNotifications(true);
    try {
      console.log("Manually requesting notification permissions...");
      const enabled = await requestNotificationPermissions();
      
      if (enabled && user) {
        console.log("✅ Notifications enabled successfully!");
        setUser({
          ...user,
          hasEnabledNotifications: true
        });
        
        // Send welcome notification if notifications were just enabled
        if (user.fid) {
          await sendWelcomeNotification(user.fid);
        }
      } else {
        console.log("❌ Failed to enable notifications");
      }
    } catch (error) {
      console.error("Error requesting notifications:", error);
    } finally {
      setIsRequestingNotifications(false);
    }
  };

  // Function to handle successful deposit
  const handleDepositSuccess = () => {
    // Increment the refresh trigger to force the waitlist to reload
    setRefreshWaitlist(prev => prev + 1);
  };

  // Initialize Frame SDK and handle automatic authentication
  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      try {
        // Check if already signed in
        let currentUser = null;
        if (isSignedIn()) {
          currentUser = getUser();
          console.log("User already authenticated:", currentUser);
        } else {
          // Authenticate silently
          currentUser = await signIn();
          console.log("User authenticated:", currentUser);
        }

        if (mounted && currentUser) {
          setUser(currentUser);

          // Always check app status when loading
          const context = await sdk.context;
          const isCurrentlyAdded = context?.client?.added || false;
          const hasNotifications = !!context?.client?.notificationDetails;
          
          console.log("App status check:", { 
            isCurrentlyAdded, 
            hasNotifications,
            storedStatus: currentUser.hasAddedApp 
          });
          
          // Update user object with current status from context
          if (currentUser.hasAddedApp !== isCurrentlyAdded || 
              currentUser.hasEnabledNotifications !== hasNotifications) {
            currentUser.hasAddedApp = isCurrentlyAdded;
            currentUser.hasEnabledNotifications = hasNotifications;
            setUser({...currentUser});
          }

          // Fetch Neynar data for all waitlist users when app loads
          if (currentUser.fid) {
            try {
              console.log(`🔍 [PAGE] Fetching Neynar data for all waitlist users...`);
              const waitlistResponse = await fetch('/api/waitlist-neynar-data');
              console.log(`🔍 [PAGE] Waitlist API response status: ${waitlistResponse.status}`);
              
              if (!waitlistResponse.ok) {
                console.error(`❌ [PAGE] Error fetching waitlist Neynar data: ${waitlistResponse.status}`);
                const errorText = await waitlistResponse.text();
                console.error(`❌ [PAGE] Error details: ${errorText}`);
              } else {
                const waitlistData = await waitlistResponse.json();
                console.log(`✅ [PAGE] Waitlist API response received`);
                
                if (waitlistData.success) {
                  const neynarDataLength = waitlistData.raw_neynar_data?.length || 0;
                  console.log(`✅ [PAGE] Successfully fetched raw Neynar data for ${neynarDataLength} waitlist users`);
                  
                  // Log the complete raw Neynar data for all users
                  console.log(`📊 ALL WAITLIST USERS NEYNAR RAW DATA:`, waitlistData.raw_neynar_data);
                  
                  // Log each user individually for easier exploration
                  if (waitlistData.raw_neynar_data && waitlistData.raw_neynar_data.length > 0) {
                    waitlistData.raw_neynar_data.forEach((user: NeynarUser, index: number) => {
                      console.log(`👤 Neynar User #${index + 1} (FID: ${user.fid}, Username: ${user.username}):`, user);
                    });
                  }
                } else {
                  console.error(`❌ [PAGE] API reported failure: ${waitlistData.error || 'No error details provided'}`);
                }
              }
            } catch (waitlistError) {
              console.error('❌ [PAGE] Error loading waitlist Neynar data:', waitlistError);
            }
          }

          // If the app is not added, automatically prompt to add it
          if (!isCurrentlyAdded) {
            console.log("App not added, prompting automatically...");
            try {
              const result = await promptAddFrameAndNotifications();
              console.log("Add frame result:", JSON.stringify(result, null, 2));

              if (result.added) {
                console.log("App successfully added!");
                if (currentUser && mounted) {
                  currentUser.hasAddedApp = true;
                  currentUser.hasEnabledNotifications = !!result.notificationDetails;
                  setUser({...currentUser});
                  
                  // Explicitly send welcome notification when app is added
                  if (currentUser.fid) {
                    console.log("Sending explicit welcome notification...");
                    try {
                      const notificationSent = await sendWelcomeNotification(currentUser.fid);
                      console.log("Welcome notification sent result:", notificationSent);
                    } catch (notificationError) {
                      console.error("Error sending welcome notification:", notificationError);
                    }
                  }
                }
              } else {
                console.log("Failed to add app automatically");
              }
            } catch (addError) {
              console.error("Error adding frame:", addError);
            }
          }
        }
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        if (mounted) {
          // Signal to Farcaster client that the app is ready, even if there were errors
          try {
            console.log("Signaling app is ready to Farcaster client...");
            await sdk.actions.ready();
            console.log("Ready signal sent successfully");
          } catch (readyError) {
            console.error("Error sending ready signal:", readyError);
          }
          
          setIsLoading(false);
        }
      }
    };

    initApp();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white">
        <div className="text-2xl font-semibold">Loading...</div>
      </main>
    );
  }

  return (
    <>
      <GameBanner />
      <main className="flex min-h-screen flex-col items-center pt-16 py-8 px-4 bg-white">
        <div className="max-w-md w-full">
          {user?.hasAddedApp && <WaitlistCounter refreshTrigger={refreshWaitlist} />}
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Dollarchain, a social coordination game.</h1>
          </div>
          
          {user?.hasAddedApp ? (
            <>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-2">How it works:</h2>
                <p className="text-gray-700">
                  Start a team chain with $1 deposit, coordinate to form the longest chain, and the winning chain splits the total pot evenly among its members.
                </p>
              </div>
              
              <div className="mb-6 text-center">
                <DepositButton onDepositSuccess={handleDepositSuccess} />
              </div>
              
              {/* Display waitlist users for all authenticated users */}
              {user?.fid && (
                <WaitlistUsers refreshTrigger={refreshWaitlist} />
              )}
              
              {!user.hasEnabledNotifications && (
                <div className="text-center mt-6">
                  <button
                    onClick={handleRequestNotifications}
                    disabled={isRequestingNotifications}
                    className="px-4 py-2 bg-[#00C853] text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isRequestingNotifications ? "Requesting..." : "Enable Notifications"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="animate-pulse text-purple-600 text-center">
              [STAGINGV2] Loading...
            </div>
          )}
        </div>
      </main>
    </>
  );
}
