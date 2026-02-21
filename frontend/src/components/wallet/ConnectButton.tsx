import { useState, useRef, useEffect } from 'react';
import { Wallet, ChevronDown, Copy, Check, LogOut, AlertTriangle } from 'lucide-react';
import { useWalletContext } from './WalletContext';
import { truncateAddress, formatETH } from '../../lib/formatters';
import { CHAIN_CONFIG, CHAIN_ID } from '../../lib/constants';

export function ConnectButton() {
  const { address, state, balance, chainId, connect, disconnect, switchNetwork } = useWalletContext();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!window.ethereum) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 transition-all duration-200 hover:bg-amber-500/20"
      >
        <AlertTriangle className="h-4 w-4" />
        Install MetaMask
      </a>
    );
  }

  if (state === 'disconnected' || state === 'connecting') {
    return (
      <button
        onClick={connect}
        disabled={state === 'connecting'}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
      >
        <Wallet className="h-4 w-4" />
        {state === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  if (state === 'wrong_network') {
    return (
      <button
        onClick={switchNetwork}
        className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 transition-all duration-200 hover:bg-amber-500/20"
      >
        <AlertTriangle className="h-4 w-4" />
        Switch to {CHAIN_CONFIG[CHAIN_ID]?.name || 'correct network'}
      </button>
    );
  }

  const networkName = chainId ? CHAIN_CONFIG[chainId]?.name || `Chain ${chainId}` : '';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm transition-all duration-200 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/8"
      >
        <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/50" />
        <span className="font-mono text-gray-700 dark:text-zinc-300">{truncateAddress(address)}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-500 dark:text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#111113]/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="border-b border-gray-100 dark:border-white/6 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {networkName}
            </div>
            <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{formatETH(balance)}</div>
          </div>
          <div className="p-2">
            <button
              onClick={handleCopy}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
