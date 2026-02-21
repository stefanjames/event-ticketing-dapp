import { formatEther } from 'ethers';

export function formatETH(wei: bigint): string {
  const eth = formatEther(wei);
  const num = parseFloat(eth);
  if (num === 0) return '0 ETH';
  if (num < 0.0001) return '< 0.0001 ETH';
  return `${num.toFixed(4)} ETH`;
}

export function formatETHShort(wei: bigint): string {
  const eth = formatEther(wei);
  const num = parseFloat(eth);
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  return num.toFixed(4);
}

export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(timestamp: bigint): string {
  const now = Date.now() / 1000;
  const ts = Number(timestamp);
  const diff = ts - now;

  if (diff < 0) {
    const past = Math.abs(diff);
    if (past < 60) return 'just now';
    if (past < 3600) return `${Math.floor(past / 60)}m ago`;
    if (past < 86400) return `${Math.floor(past / 3600)}h ago`;
    if (past < 604800) return `${Math.floor(past / 86400)}d ago`;
    return formatDate(timestamp);
  }

  if (diff < 3600) return `in ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `in ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `in ${Math.floor(diff / 86400)}d`;
  return formatDate(timestamp);
}

export function getTicketAccentColor(eventId: bigint): string {
  const colors = [
    '#06b6d4', '#8b5cf6', '#f43f5e', '#10b981',
    '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6',
  ];
  return colors[Number(eventId) % colors.length];
}
