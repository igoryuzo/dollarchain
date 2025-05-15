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
import Image from 'next/image';
// import DepositButton from './components/DepositButton';
// import WaitlistUsers from './components/WaitlistUsers';
// import WaitlistCounter from './components/WaitlistCounter';
// import GameBanner from './components/GameBanner';

function getNextNoonEastern() {
  // Get current time in NY (Eastern)
  const now = new Date();
  // Get NY offset in minutes for now
  const nyOffsetMinutes = -new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getTimezoneOffset();
  // Get current NY time
  const nowInNY = new Date(now.getTime() + (nyOffsetMinutes - now.getTimezoneOffset()) * 60000);

  // Set target to today at 12:00pm NY time
  const targetNY = new Date(nowInNY);
  targetNY.setHours(12, 0, 0, 0);
  if (nowInNY.getHours() >= 12) {
    // If it's already past noon, set to tomorrow
    targetNY.setDate(targetNY.getDate() + 1);
  }

  // Get the UTC time for targetNY
  const targetUtc = new Date(targetNY.getTime() - (nyOffsetMinutes * 60000));
  return targetUtc;
}

function useCountdownToNoonEastern() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const target = getNextNoonEastern();
      const diff = Math.max(0, target.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);
  return timeLeft;
}

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);
  // const [refreshWaitlist, setRefreshWaitlist] = useState(0); // For triggering waitlist refresh
  const timeLeft = useCountdownToNoonEastern();

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
  // const handleDepositSuccess = () => {
  //   // Increment the refresh trigger to force the waitlist to reload
  //   setRefreshWaitlist(prev => prev + 1);
  // };

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
    <main className="min-h-screen bg-white text-gray-900 px-4 py-8 pb-16 flex flex-col items-center justify-center">
      {/* Countdown Timer */}
      <div className="mb-6 flex flex-col items-center">
        <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">Game starts in</span>
        <span className="text-3xl font-mono font-bold text-[#00C853]">
          {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg border border-gray-100 p-8 flex flex-col items-center">
        <div className="flex items-center justify-center mb-8">
          <Image src="/images/dollarchain-logo.png" alt="Dollarchain Logo" width={40} height={40} className="h-10 w-10 mr-3" />
          <h1 className="text-3xl font-bold text-center text-[#00C853]">Dollarchain</h1>
        </div>
        <div className="flex flex-col gap-6 w-full">
          <a
            href="/game"
            className="block w-full text-center bg-[#00C853] hover:bg-[#00b34d] text-white font-bold py-4 rounded-lg text-lg shadow transition-all duration-150"
          >
            Start Chain
          </a>
          <a
            href="/leaderboard"
            className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-lg text-lg shadow transition-all duration-150 border border-gray-200"
          >
            Leaderboard
          </a>
          <a
            href="/launch"
            className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-lg text-lg shadow transition-all duration-150 border border-gray-200"
          >
            Game Rules
          </a>
        </div>
        {/* Hidden Enable Notifications button for logic purposes */}
        {user && !user.hasEnabledNotifications && (
          <div className="text-center mt-6">
            <button
              onClick={handleRequestNotifications}
              disabled={isRequestingNotifications}
              className="hidden px-4 py-2 bg-[#00C853] text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isRequestingNotifications ? "Requesting..." : "Enable Notifications"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
