/**
 * Configuración de RabbyKit para múltiples wallets
 * 
 * RabbyKit proporciona mejor compatibilidad con diferentes wallets
 * incluyendo MetaMask, WalletConnect, Coinbase, Rainbow, etc.
 */
import { createConfig } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { getDefaultConfig } from '@rabby-wallet/rabbykit';

// Configuración de cadenas
export const chains = [
  polygonAmoy, // Amoy testnet (principal para desarrollo)
  polygon      // Polygon mainnet (para producción)
];

// Configuración de RabbyKit con múltiples wallets
export const config = getDefaultConfig({
  appName: 'ZK Login Web',
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: chains,
  ssr: false, // Si usas Next.js, ponlo en true
});

// Configuración específica para Polygon Amoy
export const amoyChain = {
  id: 80002,
  name: 'Polygon Amoy Testnet',
  network: 'amoy',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
    public: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Amoy PolygonScan', 
      url: 'https://amoy.polygonscan.com' 
    },
  },
  testnet: true,
};

// Configuración para Polygon Mainnet
export const polygonChain = {
  id: 137,
  name: 'Polygon',
  network: 'polygon',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://polygon-rpc.com'],
    },
    public: {
      http: ['https://polygon-rpc.com'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'PolygonScan', 
      url: 'https://polygonscan.com' 
    },
  },
  testnet: false,
};