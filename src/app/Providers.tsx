'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

// GenLayer Bradbury Testnet — same chain config as snake-protocol
export const genlayerBradbury = {
  id: 4221,
  name: 'GenLayer Bradbury',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://zksync-os-testnet-genlayer.zksync.dev'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer-bradbury.genlayer.com' },
  },
} as const;

// GenLayer Studionet — fast consensus dev/demo network.
// ChainId must match genlayer-js `chains.studionet.id` (61999) or viem will
// throw `chainId should be same as current chainId` on writeContract.
export const genlayerStudionet = {
  id: 61999,
  name: 'GenLayer Studionet',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://studio.genlayer.com/api'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://studio.genlayer.com' },
  },
} as const;

const config = getDefaultConfig({
  appName: 'Pitch Wars',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [genlayerStudionet, genlayerBradbury],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#fbbf24',
            accentColorForeground: '#06060e',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
