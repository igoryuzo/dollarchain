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

// Export the hooks for use in components
export { useSignIn, useProfile, useAppClient, AuthKitProvider }; 