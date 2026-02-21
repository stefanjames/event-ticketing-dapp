import { createContext, useContext, type ReactNode } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useContract } from '../../hooks/useContract';
import { Contract, BrowserProvider, JsonRpcSigner } from 'ethers';
import type { WalletState } from '../../types';

interface WalletContextValue {
  address: string;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  chainId: number | null;
  state: WalletState;
  balance: bigint;
  contract: Contract | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const contract = useContract(wallet.signer);

  return (
    <WalletContext.Provider value={{ ...wallet, contract }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used within WalletProvider');
  return ctx;
}
