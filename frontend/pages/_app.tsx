'use client';
import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets, RainbowKitProvider, Chain } from '@rainbow-me/rainbowkit';
import type { AppProps } from 'next/app';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';

import { publicProvider } from 'wagmi/providers/public';
import { myChains } from '../helpers/config';


const { chains, publicClient, webSocketPublicClient } = configureChains(
  [myChains.scrollSepolia, myChains.mantleTestnet],
  [publicProvider()]
);

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";

const { connectors } = getDefaultWallets({
  appName: 'RainbowKit App',
  projectId: projectId,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default MyApp;
