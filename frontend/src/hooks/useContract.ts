import { useMemo } from 'react';
import { Contract, JsonRpcSigner, BrowserProvider } from 'ethers';
import ABI from '../abi/EventTicketing.json';
import { CONTRACT_ADDRESS } from '../lib/constants';

export function useContract(signerOrProvider: JsonRpcSigner | BrowserProvider | null): Contract | null {
  return useMemo(() => {
    if (!signerOrProvider || !CONTRACT_ADDRESS) return null;
    return new Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
  }, [signerOrProvider]);
}
