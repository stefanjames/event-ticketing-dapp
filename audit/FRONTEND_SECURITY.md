# ChainTix Frontend Security Assessment

**Date**: 2026-02-20
**Frontend Stack**: React 18 + TypeScript + Vite + ethers.js v6
**Assessor**: Stefan James

---

## 1. Wallet Connection Security

- [x] **Only connects via window.ethereum** — No private key input anywhere in the codebase. Connection uses `BrowserProvider(window.ethereum)` and `eth_requestAccounts` (`useWallet.ts:96`).
- [x] **Handles account/chain changes** — `accountsChanged` and `chainChanged` events listened on `window.ethereum` with proper cleanup on unmount (`useWallet.ts:81-87`).
- [x] **Validates chain ID** — `CHAIN_ID` from env vars compared against connected chain. State set to `wrong_network` on mismatch (`useWallet.ts:52,106`).
- [x] **Displays clear error when wrong network** — `ConnectButton.tsx:56-65` shows amber warning button with "Switch to {network}" prompt that calls `wallet_switchEthereumChain`.
- [x] **No sensitive data stored in localStorage/sessionStorage** — Only `chaintix-theme` (light/dark preference) stored in localStorage (`ThemeContext.tsx`). No keys, no tokens.
- [x] **Wallet disconnect clears all state** — `disconnect()` at `useWallet.ts:113-119` resets address, signer, chainId, state, and balance to defaults.

## 2. Transaction Security

- [x] **MetaMask shows confirmation before signing** — All transactions go through `contract.functionName()` which triggers MetaMask popup. Users see gas estimate and value in MetaMask natively.
- [ ] **Transaction parameters displayed BEFORE MetaMask popup** — *Partial*. `CreateEventForm.tsx` shows form values but doesn't show a pre-confirmation summary with exact ETH amount and gas estimate before the MetaMask popup. The EventDetails page shows ticket price but relies on MetaMask for final confirmation.
- [ ] **Gas estimates shown** — Not explicitly shown in the UI. MetaMask handles gas estimation internally.
- [x] **Failed transactions display meaningful error messages** — `parseContractError()` at `contract.ts:9-41` maps all 20+ custom errors to human-readable messages. Covers user rejection, insufficient funds, and all contract reverts.
- [x] **Pending state prevents double-submission** — `CreateEventForm.tsx:211-214` disables submit button during `pending`/`confirming`. `TicketCard.tsx:107` disables refund/transfer buttons via `loading` state. `EventDetails` (purchase flow) disables during transaction.
- [x] **Transaction receipts verified** — All write operations call `await tx.wait()` to wait for on-chain confirmation, not just the tx hash (`CreateEventForm.tsx:58`, `TicketCard.tsx:32,46`).

## 3. Input Validation (Client-Side)

- [x] **Form inputs have HTML validation** — All inputs in `CreateEventForm.tsx` use `required`, `min`, `step` attributes. Date and time use native input types.
- [ ] **ETH amounts validated** — *Partial*. HTML `min="0.000000000000000001"` prevents negative values, but no explicit check for extremely large values. `parseEther()` would throw on invalid input, which is caught by the error handler.
- [ ] **Addresses validated** — *Partial*. Transfer input at `TicketCard.tsx:121` accepts any string starting with `0x...`. No checksum validation or length check before calling the contract. The contract will revert on invalid addresses, but a client-side check would provide better UX.
- [x] **String inputs are safe** — Event names/descriptions are rendered as React text nodes (JSX `{event.name}`), never as HTML. React auto-escapes all text content, preventing XSS.
- [x] **Quantity bounded by contract** — `MAX_TICKETS_PER_PURCHASE = 10` enforced on-chain. Frontend purchase UIs send quantity directly to the contract which validates it.
- [x] **Date inputs validated** — HTML `date` input type prevents invalid dates. The contract itself validates `date > block.timestamp`.
- [x] **No raw user input to ethers without validation** — All contract calls go through typed ethers.js methods that handle encoding.

## 4. Data Display Security

- [x] **BigInt properly formatted** — `formatters.ts` uses `ethers.formatEther()` for ETH values. `Number()` used for display-safe conversions of small values (ticketsSold, eventId).
- [x] **Addresses truncated safely** — `truncateAddress()` in `formatters.ts` shows `0x1234...5678` pattern.
- [x] **ETH values formatted** — `formatETH()` in `formatters.ts` formats to human-readable values.
- [x] **No dangerouslySetInnerHTML** — Grep of entire frontend codebase confirms zero usage of `dangerouslySetInnerHTML`.
- [x] **Event descriptions rendered as text** — All user-generated content (event name, description, venue) rendered via JSX text interpolation `{event.name}` which React auto-escapes.
- [x] **External URLs use noopener noreferrer** — MetaMask install link in `ConnectButton.tsx:34` uses `target="_blank" rel="noopener noreferrer"`.

## 5. State Management Security

- [x] **Contract state re-fetched after writes** — `useEvents` and `useTickets` hooks refetch data. Components call `onUpdate?.()` callbacks after successful transactions (`TicketCard.tsx:34,50`).
- [ ] **Optimistic updates rolled back** — Not applicable. The app does not use optimistic updates — it waits for `tx.wait()` confirmation before updating UI state.
- [x] **No sensitive data persists after disconnect** — `disconnect()` clears all wallet state. Only `chaintix-theme` persists (non-sensitive).
- [ ] **Error boundaries** — No React error boundaries implemented. A contract error in a component could cause a white screen. *Recommendation: Add a root-level error boundary.*

## 6. Dependency Security

**Frontend `npm audit` results:**
```
10 high severity vulnerabilities

All from: minimatch <10.2.1 (ReDoS vulnerability)
Affected: eslint, @typescript-eslint/* packages
```

- [ ] **npm audit clean** — 10 high-severity vulnerabilities, all in `minimatch` (dev dependency only — `eslint` and `@typescript-eslint`). These are **build-time only** and do not affect the production bundle. No runtime vulnerabilities.
- [x] **No known vulnerable runtime dependencies** — ethers.js v6.16.0, React 19.2.0, and all runtime deps are clean.
- [x] **ethers.js version pinned** — `"ethers": "^6.16.0"` in package.json with lockfile.
- [x] **Dependencies from reputable sources** — All from npm registry: React, ethers.js, framer-motion, lucide-react, react-hot-toast.

## 7. Environment & Build Security

- [x] **.env files in .gitignore** — Both root `.gitignore` and `frontend/.gitignore` exclude `.env` files.
- [x] **No secrets in source code** — Grep for "private", "secret", "key" in frontend src shows no hardcoded credentials. Contract address and chain ID loaded from env vars.
- [x] **Contract ABI imported statically** — `import ABI from '../abi/EventTicketing.json'` in `contract.ts:2` and `useContract.ts:3`. Not fetched from external URL.
- [x] **Config via env vars** — `CONTRACT_ADDRESS`, `CHAIN_ID`, `RPC_URL` all loaded from `import.meta.env.VITE_*` in `constants.ts:1-3`.
- [x] **No source maps in production** — Vite default production build does not include source maps.

## 8. Common Web3 Frontend Pitfalls

- [x] **BigInt comparisons** — `useEvents.ts` and `useTickets.ts` use proper BigInt handling via ethers.js return types. Display conversions use `Number()` only for small, safe values.
- [x] **ethers.js v6 API** — Uses v6 patterns: `BrowserProvider` (not `Web3Provider`), `JsonRpcSigner`, `Contract` with proper typing. `parseEther` from ethers v6.
- [x] **Contract instance uses signer for writes** — `useContract.ts:6-10` creates contract with signer (from wallet) for write operations. Read operations use the same signer-backed provider.
- [x] **Event listeners cleaned up** — `useWallet.ts:84-87` returns cleanup function that calls `removeListener` for both `accountsChanged` and `chainChanged`.
- [x] **Account switching handled** — `handleAccountsChanged` at `useWallet.ts:65-74` handles account change by re-initializing the provider, and handles disconnect (empty accounts array).

## Summary

| Category | Score | Notes |
|----------|-------|-------|
| Wallet Connection | 6/6 | All checks pass |
| Transaction Security | 4/6 | Missing pre-confirmation UI and gas estimates |
| Input Validation | 5/7 | Address validation and ETH bounds could be tighter |
| Data Display | 6/6 | All checks pass |
| State Management | 3/4 | Missing error boundary |
| Dependencies | 3/4 | Dev-only audit findings (minimatch) |
| Environment & Build | 5/5 | All checks pass |
| Web3 Pitfalls | 5/5 | All checks pass |
| **Total** | **37/43** | **86% — Good for portfolio prototype** |

## Recommendations

1. **Add address validation** — Validate Ethereum address format (length, checksum) before calling `transferTicket`.
2. **Add error boundary** — Wrap the app in a React error boundary to prevent white-screen crashes.
3. **Pre-confirmation summary** — Show a summary card (event name, quantity, total ETH) before triggering MetaMask popup.
4. **Update dev dependencies** — Run `npm audit fix` to resolve minimatch vulnerability in eslint toolchain.
