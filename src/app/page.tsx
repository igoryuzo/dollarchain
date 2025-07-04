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

function useCountdownToGameEnd() {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [target, setTarget] = useState<Date | null>(null);

  useEffect(() => {
    // Fetch end_time from API
    fetch('/api/game/active')
      .then(res => res.json())
      .then(data => {
        if (data && data.end_time) {
          setTarget(new Date(data.end_time));
        } else {
          setTarget(null);
        }
      })
      .catch(() => setTarget(null));
  }, []);

  useEffect(() => {
    function updateCountdown() {
      if (!target) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const now = new Date();
      const diff = Math.max(0, target.getTime() - now.getTime());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second
    return () => clearInterval(interval);
  }, [target]);
  return timeLeft;
}

function getSecondsUntilNextDeposit(lastDeposit: string | null) {
  if (!lastDeposit) return 0;
  const last = new Date(lastDeposit).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - last) / 1000);
  return Math.max(3600 - elapsed, 0);
}

function HomeDepositTimer({ lastDeposit }: { lastDeposit: string | null }) {
  const [timer, setTimer] = useState(() => getSecondsUntilNextDeposit(lastDeposit));
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(getSecondsUntilNextDeposit(lastDeposit));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastDeposit]);
  if (timer > 0) {
    const m = Math.floor(timer / 60).toString().padStart(2, '0');
    const s = (timer % 60).toString().padStart(2, '0');
    return (
      <div className="mb-3 text-xs font-mono text-blue-700 text-center">
        Next deposit in <span className="font-bold">{m}:{s}</span>
      </div>
    );
  }
  return (
    <div className="mb-3 text-xs font-mono text-blue-700 text-center">
      Ready
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);
  const [gameActive, setGameActive] = useState(true); // default true for now
  // const [refreshWaitlist, setRefreshWaitlist] = useState(0); // For triggering waitlist refresh
  const timeLeft = useCountdownToGameEnd();
  const [userTeams, setUserTeams] = useState<{ id: number; team_name: string; role: string }[] | null>(null);
  const [lastDeposit, setLastDeposit] = useState<string | null>(null);

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
        // Check if we have cached auth data in sessionStorage
        let currentUser = null;
        const storedAuth = typeof window !== 'undefined' ? sessionStorage.getItem('authState') : null;
        
        if (storedAuth) {
          // Use cached auth data to prevent new sign-in flow
          currentUser = JSON.parse(storedAuth);
          console.log("Using cached auth:", currentUser);
        } else if (isSignedIn()) {
          currentUser = getUser();
          console.log("User already authenticated:", currentUser);
          // Cache the auth data
          if (typeof window !== 'undefined' && currentUser) {
            sessionStorage.setItem('authState', JSON.stringify(currentUser));
          }
        } else {
          // Only call signIn when absolutely necessary
          currentUser = await signIn();
          console.log("User authenticated:", currentUser);
          // Cache the auth data
          if (typeof window !== 'undefined' && currentUser) {
            sessionStorage.setItem('authState', JSON.stringify(currentUser));
          }
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
            
            // Also update the cached data with the new status
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('authState', JSON.stringify(currentUser));
            }
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

  // Fetch active game status
  useEffect(() => {
    fetch('/api/game/active')
      .then(res => res.json())
      .then(data => {
        setGameActive(!!data.button_active);
      })
      .catch(() => setGameActive(false));
  }, [user]);

  // Fetch user's teams after user is loaded
  useEffect(() => {
    if (!user) return;
    fetch('/api/user/teams', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUserTeams(data.teams || []))
      .catch(() => setUserTeams([]));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Fetch last deposit for the user in the active game
    fetch('/api/game/active')
      .then(res => res.json())
      .then(data => {
        if (!data || !data.active || !data.start_time) return;
        fetch('/api/deposits/precheck', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
          .then(res => res.json())
          .then(precheck => {
            if (precheck && precheck.lastDeposit) {
              setLastDeposit(precheck.lastDeposit);
            } else {
              setLastDeposit(null);
            }
          });
      });
  }, [user]);

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
        <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">Game Ending In</span>
        <div className="flex items-center space-x-2 text-2xl font-mono font-bold text-[#00C853]">
          {timeLeft.days > 0 && (
            <>
              <div className="flex flex-col items-center">
                <span>{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="text-xs text-gray-500 uppercase mt-1">Days</span>
              </div>
              <span>:</span>
            </>
          )}
          <div className="flex flex-col items-center">
            <span>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-xs text-gray-500 uppercase mt-1">Hrs</span>
          </div>
          <span>:</span>
          <div className="flex flex-col items-center">
            <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-xs text-gray-500 uppercase mt-1">Min</span>
          </div>
          <span>:</span>
          <div className="flex flex-col items-center">
            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-xs text-gray-500 uppercase mt-1">Sec</span>
          </div>
        </div>
        {/* <div className="mt-3">
          <span
            onClick={() => sdk.actions.openUrl("https://warpcast.com/~/channel/dollarchain")}
            className="text-base font-semibold hover:underline cursor-pointer"
          >
            <span className="text-gray-500">Follow </span><span className="font-bold text-[#7c3aed]">/dollarchain</span>
          </span>
        </div> */}
      </div>
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg border border-gray-100 p-8 flex flex-col items-center">
        <div className="flex items-center justify-center mb-8">
          <Image src="/images/dollarchain-logo.png" alt="Dollarchain Logo" width={40} height={40} className="h-10 w-10 mr-3" />
          <h1 className="text-3xl font-bold text-center text-[#00C853]">Dollarchain</h1>
        </div>
        {/* Countdown until user can deposit again */}
        {user && lastDeposit !== null && (
          <HomeDepositTimer lastDeposit={lastDeposit} />
        )}
        <div className="flex flex-col gap-6 w-full">
          {userTeams && userTeams.length > 0 ? (
            <a
              href="/my-teams"
              className="block w-full text-center font-bold py-4 rounded-lg text-lg shadow transition-all duration-150 bg-[#00C853] hover:bg-[#00b34d] text-white"
              tabIndex={0}
            >
              Go To My Team(s)
            </a>
          ) : (
            <a
              href={gameActive ? "/game" : undefined}
              className={`block w-full text-center font-bold py-4 rounded-lg text-lg shadow transition-all duration-150 ${gameActive ? 'bg-[#00C853] hover:bg-[#00b34d] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'}`}
              tabIndex={gameActive ? 0 : -1}
              aria-disabled={!gameActive}
            >
              Start Chain
            </a>
          )}
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
