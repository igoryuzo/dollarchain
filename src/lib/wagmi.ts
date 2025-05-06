import { createConfig, http } from 'wagmi';
import { optimism } from 'wagmi/chains';
import farcasterFrameConnector from '@farcaster/frame-wagmi-connector';

// Create wagmi config with Farcaster Frame connector
export const config = createConfig({
  chains: [optimism],
  connectors: [
    farcasterFrameConnector(),
  ],
  transports: {
    [optimism.id]: http(),
  },
}); 