import { createConfig, http } from 'wagmi';
import { optimism, base } from 'wagmi/chains';
import farcasterFrameConnector from '@farcaster/frame-wagmi-connector';

// Create wagmi config with Farcaster Frame connector
export const config = createConfig({
  chains: [base, optimism],
  connectors: [
    farcasterFrameConnector(),
  ],
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
  },
}); 