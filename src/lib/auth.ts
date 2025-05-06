import { AuthKitProvider, useSignIn, useProfile, useAppClient } from '@farcaster/auth-kit';
import { randomBytes } from 'crypto';

export interface AuthUser {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
  sessionToken: string;
  hasAddedApp: boolean;
  hasEnabledNotifications: boolean;
}

// Define Auth Kit config for client-side initialization
export const authKitConfig = {
  relay: 'https://relay.farcaster.xyz',
  rpcUrl: 'https://mainnet.optimism.io',
  domain: typeof window !== 'undefined' ? window.location.host : 'www.dollarchain.xyz',
  siweUri: typeof window !== 'undefined' ? window.location.origin : 'https://www.dollarchain.xyz',
};

// Generate a secure nonce for authentication
export function generateNonce(): string {
  return randomBytes(16).toString('hex');
}

// Hook for automatic sign-in
export function useAutoSignIn() {
  const { signIn } = useSignIn({ nonce: generateNonce() });
  const { isAuthenticated } = useProfile();

  // Function to trigger sign-in if not already authenticated
  const autoSignIn = async () => {
    if (!isAuthenticated) {
      try {
        await signIn();
        return true;
      } catch (error) {
        console.error("Auto sign-in failed:", error);
        return false;
      }
    }
    return true;
  };

  return { autoSignIn, isAuthenticated };
}

// Export the hooks for use in components
export { useSignIn, useProfile, useAppClient, AuthKitProvider }; 