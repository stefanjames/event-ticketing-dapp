import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { CHAIN_ID } from '../lib/constants';
import type { WalletState } from '../types';

interface UseWalletReturn {
  address: string;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  chainId: number | null;
  state: WalletState;
  balance: bigint;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
}

export function useWallet(): UseWalletReturn {
  const [address, setAddress] = useState('');
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [state, setState] = useState<WalletState>('disconnected');
  const [balance, setBalance] = useState<bigint>(0n);

  const updateBalance = useCallback(async (prov: BrowserProvider, addr: string) => {
    try {
      const bal = await prov.getBalance(addr);
      setBalance(bal);
    } catch {
      // ignore balance fetch errors
    }
  }, []);

  const setupProvider = useCallback(async () => {
    if (!window.ethereum) return;

    const prov = new BrowserProvider(window.ethereum);
    setProvider(prov);

    try {
      const accounts = await prov.listAccounts();
      if (accounts.length > 0) {
        const s = await prov.getSigner();
        const addr = await s.getAddress();
        const network = await prov.getNetwork();
        const cid = Number(network.chainId);

        setSigner(s);
        setAddress(addr);
        setChainId(cid);
        setState(cid === CHAIN_ID ? 'connected' : 'wrong_network');
        updateBalance(prov, addr);
      }
    } catch {
      // no connected accounts
    }
  }, [updateBalance]);

  useEffect(() => {
    setupProvider();

    if (!window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        setAddress('');
        setSigner(null);
        setState('disconnected');
        setBalance(0n);
      } else {
        setupProvider();
      }
    };

    const handleChainChanged = () => {
      setupProvider();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [setupProvider]);

  const connect = useCallback(async () => {
    if (!window.ethereum) return;

    setState('connecting');
    try {
      const prov = new BrowserProvider(window.ethereum);
      await prov.send('eth_requestAccounts', []);
      const s = await prov.getSigner();
      const addr = await s.getAddress();
      const network = await prov.getNetwork();
      const cid = Number(network.chainId);

      setProvider(prov);
      setSigner(s);
      setAddress(addr);
      setChainId(cid);
      setState(cid === CHAIN_ID ? 'connected' : 'wrong_network');
      updateBalance(prov, addr);
    } catch {
      setState('disconnected');
    }
  }, [updateBalance]);

  const disconnect = useCallback(() => {
    setAddress('');
    setSigner(null);
    setChainId(null);
    setState('disconnected');
    setBalance(0n);
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
    } catch {
      // Chain may need to be added
    }
  }, []);

  return { address, signer, provider, chainId, state, balance, connect, disconnect, switchNetwork };
}
