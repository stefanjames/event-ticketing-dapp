# dApp Security Audit & Launch Checklist

Use this checklist for every dApp before considering it complete. Copy this file into each new project's `/audit` folder.

---

## Phase 1: Smart Contract Audit

### Compiler & Build
- [ ] Exact pragma version (no floating `^`)
- [ ] Compiles with zero warnings (`forge build --deny-warnings` or `solc --strict`)
- [ ] No unused imports
- [ ] All dependencies pinned to specific versions

### SWC Registry Scan
- [ ] SWC-100: All functions have explicit visibility
- [ ] SWC-101: Integer overflow/underflow protected (0.8.x or SafeMath)
- [ ] SWC-103: Fixed pragma version
- [ ] SWC-104: All external call return values checked
- [ ] SWC-105: Ether withdrawal access-controlled
- [ ] SWC-107: ReentrancyGuard on all ETH-sending functions
- [ ] SWC-108: All state variables have explicit visibility
- [ ] SWC-110: No `assert()` for input validation (use `require`/`revert`)
- [ ] SWC-111: No deprecated Solidity functions
- [ ] SWC-113: No DoS via failed calls or unbounded loops
- [ ] SWC-114: Front-running risks documented or mitigated
- [ ] SWC-115: No `tx.origin` for authorization
- [ ] SWC-116: `block.timestamp` usage documented and acceptable
- [ ] SWC-118: Correct `constructor()` keyword syntax
- [ ] SWC-119: No shadowed state variables
- [ ] SWC-120: No weak randomness from block values
- [ ] SWC-128: No DoS from block gas limit in loops
- [ ] SWC-131: No unused variables
- [ ] SWC-132: No reliance on `address(this).balance`
- [ ] SWC-134: No hardcoded gas amounts in transfers
- [ ] SWC-135: No code with no effects

### Security Patterns
- [ ] Checks-Effects-Interactions followed on all external calls
- [ ] Pull-over-push for bulk payments/refunds
- [ ] Access control on all sensitive functions
- [ ] Emergency pause mechanism (Pausable)
- [ ] Input validation on all external/public functions
- [ ] Zero-address checks on all address parameters
- [ ] Event emitted for every state change
- [ ] NatSpec documentation on all public/external functions
- [ ] `receive()`/`fallback()` properly handles unexpected ETH

### Testing
- [ ] All happy paths tested
- [ ] All revert conditions tested
- [ ] Reentrancy attack simulated
- [ ] Edge cases tested (boundaries, zero values, max values)
- [ ] Access control tested (unauthorized users)
- [ ] Financial accuracy tested (amounts match)
- [ ] Gas report generated (`forge test --gas-report`)
- [ ] Coverage >= 95% (`forge coverage`)
- [ ] Fuzz tests on critical functions (bonus)

---

## Phase 2: Frontend Security

### Wallet Integration
- [ ] No private key input or storage anywhere
- [ ] Chain ID validated on connection
- [ ] Account/chain change events handled
- [ ] Disconnect clears all sensitive state
- [ ] Wrong network shows clear error with switch-network prompt

### Transaction Safety
- [ ] All tx parameters shown to user before signing
- [ ] Pending state prevents double-submission
- [ ] Failed tx show human-readable errors
- [ ] Tx confirmation waited (not just hash)
- [ ] Gas estimates displayed where possible

### Input Handling
- [ ] All inputs validated client-side before contract call
- [ ] Addresses checksummed and validated
- [ ] BigInt handled properly (no Number conversion for large values)
- [ ] No `dangerouslySetInnerHTML` with user content
- [ ] External URLs use `rel="noopener noreferrer"`

### State & Data
- [ ] Contract state refreshed after write operations
- [ ] Error boundaries prevent app crashes
- [ ] No sensitive data persisted in localStorage
- [ ] Stale data handled gracefully

### Dependencies & Build
- [ ] `npm audit` clean (or known issues documented)
- [ ] All dependencies from trusted sources
- [ ] `.env` in `.gitignore`
- [ ] No secrets in source code
- [ ] No source maps in production build
- [ ] Contract ABI bundled, not fetched externally

---

## Phase 3: Documentation

- [ ] README.md with: overview, features, tech stack, setup instructions, API reference
- [ ] Security audit report in `/audit` folder
- [ ] Frontend security assessment in `/audit` folder
- [ ] Architecture decisions documented
- [ ] Environment variables documented (`.env.example` file)
- [ ] Deployment instructions (local + testnet)

---

## Phase 4: Pre-Deployment

- [ ] Deploy to testnet (Sepolia/Mumbai) and test all flows
- [ ] Contract verified on block explorer (Etherscan/Polygonscan)
- [ ] Frontend tested with real MetaMask on testnet
- [ ] All `console.log` statements removed from production
- [ ] Error handling covers all user-facing scenarios
- [ ] Mobile responsive tested (375px — 1440px)
- [ ] Loading states for all async operations
- [ ] Empty states for all list views

---

## Sign-Off

| Check | Auditor | Date |
|-------|---------|------|
| Smart Contract Audit | | |
| Frontend Security | | |
| Documentation | | |
| Testnet Deployment | | |
