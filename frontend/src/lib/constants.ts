export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID) || 31337;
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://localhost:8545';

export const CHAIN_CONFIG: Record<number, { name: string; explorer: string }> = {
  1: { name: 'Ethereum', explorer: 'https://etherscan.io' },
  11155111: { name: 'Sepolia', explorer: 'https://sepolia.etherscan.io' },
  137: { name: 'Polygon', explorer: 'https://polygonscan.com' },
  8453: { name: 'Base', explorer: 'https://basescan.org' },
  42161: { name: 'Arbitrum', explorer: 'https://arbiscan.io' },
  31337: { name: 'Localhost', explorer: '' },
};

export const EVENT_STATUS_LABELS: Record<number, string> = {
  0: 'Active',
  1: 'Canceled',
  2: 'Completed',
};

export const TICKET_STATUS_LABELS: Record<number, string> = {
  0: 'Valid',
  1: 'Used',
  2: 'Refunded',
};

export const TICKET_ACCENT_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#10b981', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#ec4899', // pink
  '#14b8a6', // teal
];
