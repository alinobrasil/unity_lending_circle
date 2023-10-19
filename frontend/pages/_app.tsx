import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets, RainbowKitProvider, Chain } from '@rainbow-me/rainbowkit';
import type { AppProps } from 'next/app';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  arbitrum,
  goerli,
  mainnet,
  optimism,
  polygon,
  base,
  zora,
} from 'wagmi/chains';
import { ScrollSepoliaTestnet } from "@thirdweb-dev/chains";
import { publicProvider } from 'wagmi/providers/public';

const scrollSepolia: Chain = {
  id: 534351,
  name: 'Scroll Sepolia Testnet',
  network: 'scrollSepolia',
  iconUrl: 'https://example.com/icon.svg',
  iconBackground: '#fff',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://sepolia-rpc.scroll.io'] },
    default: { http: ['https://sepolia-rpc.scroll.io'] },
  },
  blockExplorers: {
    default: { name: 'ScrollScan', url: 'https://sepolia.scrollscan.dev' },
    etherscan: { name: 'ScrollScan', url: 'https://sepolia.scrollscan.dev' },
  },
  // contracts: {
  //   multicall3: {
  //     address: '0xca11bde05977b3631167028862be2a173976ca11',
  //     blockCreated: 11_907_934,
  //   },
  // },
  testnet: true,
};



const { chains, publicClient, webSocketPublicClient } = configureChains(
  [scrollSepolia],
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
