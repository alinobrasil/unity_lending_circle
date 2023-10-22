import LendingCircleArtifact from './LendingCircle.json'
import { Chain } from '@rainbow-me/rainbowkit';

export const Config = {
    scrollSepolia: {
        contractAddress: "0x4E829149DDA3542947D87EcA89206097ab2066C0",
        abi: LendingCircleArtifact.abi,
        rpcUrl: "https://sepolia-rpc.scroll.io",

    },
    mantleTestnet: {
        contractAddress: "0x4E829149DDA3542947D87EcA89206097ab2066C0",
        abi: LendingCircleArtifact.abi,
        rpcUrl: "https://mantle-testnet.scroll.io",
    }
}

//chain settings
const scrollSepolia: Chain = {
    id: 534351,
    name: 'Scroll Sepolia Testnet',
    network: 'scrollSepolia',
    iconUrl: '/scroll.jpg',
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

    testnet: true,
};

const mantleTestnet: Chain = {
    id: 5001,
    name: "Mantle Testnet",
    network: "mantleTestnet",
    iconUrl: '/mantle.jpg',
    nativeCurrency: {
        decimals: 18,
        name: "MNT",
        symbol: "MNT",
    },
    rpcUrls: {
        public: { http: ['https://rpc.testnet.mantle.xyz'] },
        default: { http: ['https://rpc.testnet.mantle.xyz'] },
    },
    blockExplorers: {
        default: { name: 'Mantle Explorer', url: 'https://rpc.testnet.mantle.xyz' },
        etherscan: { name: 'Mantle Explorer', url: 'https://rpc.testnet.mantle.xyz' },
    },
    testnet: true,
};

export const myChains = { scrollSepolia, mantleTestnet }