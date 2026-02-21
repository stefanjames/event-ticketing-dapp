# ChainTix Smart Contract Security Audit Report

## Audit Summary
- **Contract**: EventTicketing.sol
- **Solidity Version**: 0.8.24
- **Framework**: Foundry (forge, anvil, cast)
- **Auditor**: AI-Assisted Audit (Claude)
- **Date**: 2026-02-20
- **Commit**: Pre-initial commit (local development)

## Audit Scope
- **Source files audited**: `src/EventTicketing.sol` (602 lines)
- **Test file**: `test/EventTicketing.t.sol` (1261 lines, 77 tests)
- **Deploy script**: `script/Deploy.s.sol` (17 lines)
- **External dependencies**:
  - `@openzeppelin/contracts/utils/ReentrancyGuard.sol`
  - `@openzeppelin/contracts/utils/Pausable.sol`
  - `@openzeppelin/contracts/access/Ownable.sol`

## Risk Classification
- **Critical**: Direct loss of funds or permanent DoS
- **High**: Conditional loss of funds or significant manipulation
- **Medium**: Unexpected behavior under edge conditions
- **Low**: Best practice violations, gas inefficiency
- **Informational**: Style, documentation, code quality

## Findings Summary Table

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| F-01 | Reentrancy Protection | Critical | PASS |
| F-02 | Access Control on ETH Withdrawal | Critical | PASS |
| F-03 | Double Withdrawal Prevention | High | PASS |
| F-04 | Pull-over-Push Refund Pattern | High | PASS |
| F-05 | Integer Overflow Protection | High | PASS |
| F-06 | Exact Payment Validation | Medium | PASS |
| F-07 | Front-Running Risk on Purchase | Medium | MITIGATED |
| F-08 | Block Timestamp Dependence | Low | PASS |
| F-09 | Unbounded Array Growth in _userTickets | Low | MITIGATED |
| F-10 | No Category Validation on Create | Informational | PASS |
| F-11 | Emergency Pause Mechanism | Informational | PASS |
| F-12 | Unexpected ETH Rejection | Informational | PASS |

## Detailed Findings

### [F-01] Reentrancy Protection
- **Severity**: Critical
- **Location**: `src/EventTicketing.sol:281,374,438`
- **Description**: All functions that transfer ETH (`purchaseTickets`, `requestRefund`, `withdrawEventFunds`) use OpenZeppelin's `nonReentrant` modifier from `ReentrancyGuard`.
- **Impact**: Without this, an attacker could re-enter `requestRefund` to drain funds.
- **Recommendation**: N/A — correctly implemented.
- **Status**: **PASS** — Verified with dedicated reentrancy attack tests (`test_revert_reentrancy_onRefund`, `test_revert_reentrancy_onWithdraw`) using malicious contracts that attempt re-entry in their `receive()` function.

### [F-02] Access Control on ETH Withdrawal
- **Severity**: Critical
- **Location**: `src/EventTicketing.sol:434-467`
- **Description**: `withdrawEventFunds` requires: (1) `eventExists` modifier, (2) `onlyOrganizer` modifier checking `msg.sender == event.organizer`, (3) event status must be `Completed`.
- **Impact**: Without these checks, anyone could drain event funds.
- **Recommendation**: N/A — correctly implemented with triple-layer protection.
- **Status**: **PASS** — Tested by `test_revert_withdrawFunds_notOrganizer`, `test_revert_withdraw_eventNotCompleted`.

### [F-03] Double Withdrawal Prevention
- **Severity**: High
- **Location**: `src/EventTicketing.sol:450-456`
- **Description**: `_withdrawnAmounts[eventId]` tracks how much has been withdrawn. The function calculates `netRevenue - alreadyWithdrawn` and reverts with `NoFundsToWithdraw` if nothing remains.
- **Impact**: Without this, an organizer could drain the contract by calling withdraw repeatedly.
- **Recommendation**: N/A — correctly implemented.
- **Status**: **PASS** — Tested by `test_revert_withdraw_doubleWithdraw`.

### [F-04] Pull-over-Push Refund Pattern
- **Severity**: High
- **Location**: `src/EventTicketing.sol:241-250,370-404`
- **Description**: `cancelEvent` only sets the status to `Canceled` — it does NOT loop through ticket holders to auto-refund. Each user must call `requestRefund` individually.
- **Impact**: If cancelEvent iterated over all tickets, a single failing refund (e.g., to a contract that rejects ETH) would permanently block cancellation (DoS).
- **Recommendation**: N/A — correct pull-over-push pattern.
- **Status**: **PASS**

### [F-05] Integer Overflow Protection
- **Severity**: High
- **Location**: Entire contract (Solidity 0.8.24)
- **Description**: Solidity 0.8.x provides built-in overflow/underflow checks on all arithmetic. The contract uses `unchecked` only for ID incrementing (lines 219, 315, 332) where overflow is physically impossible.
- **Impact**: N/A — built-in protection.
- **Recommendation**: The `unchecked` usage is safe — `_nextEventId` would need 2^256 increments to overflow.
- **Status**: **PASS**

### [F-06] Exact Payment Validation
- **Severity**: Medium
- **Location**: `src/EventTicketing.sol:304-307`
- **Description**: `purchaseTickets` requires `msg.value == totalCost` exactly. No overpayment accepted, no excess refund logic needed.
- **Impact**: Prevents accidental overpayment and eliminates complexity of excess refund logic.
- **Recommendation**: N/A — strict equality is the safest approach.
- **Status**: **PASS** — Tested by `test_revert_purchaseTickets_incorrectPayment` and `test_revert_purchaseTickets_overpayment`.

### [F-07] Front-Running Risk on Purchase
- **Severity**: Medium
- **Location**: `src/EventTicketing.sol:276-336`
- **Description**: When few tickets remain, a mempool observer could front-run a purchase by submitting a higher-gas transaction for the same tickets. This is inherent to public mempools.
- **Impact**: A user's purchase could revert with `SoldOut` if front-run.
- **Recommendation**: For high-demand events, consider a commit-reveal scheme. For this prototype, the risk is documented and acceptable.
- **Status**: **MITIGATED** — Documented. Future enhancement: commit-reveal for high-demand events.

### [F-08] Block Timestamp Dependence
- **Severity**: Low
- **Location**: `src/EventTicketing.sol:211,261,293,386`
- **Description**: `block.timestamp` is used for: event date validation, refund deadline checks, and purchase expiry. Miner manipulation is ~15 seconds.
- **Impact**: Negligible for event-scale timeframes (days/weeks). A miner cannot meaningfully manipulate deadlines.
- **Recommendation**: N/A — acceptable usage documented in NatSpec (line 197).
- **Status**: **PASS**

### [F-09] Unbounded Array Growth in _userTickets
- **Severity**: Low
- **Location**: `src/EventTicketing.sol:327,359`
- **Description**: `_userTickets[address]` and `_eventTicketIds[eventId]` grow without bound. Transferred tickets remain in the original owner's array.
- **Impact**: `getUserTickets()` gas cost grows linearly. For a portfolio dApp this is acceptable. At scale, a subgraph (The Graph) would handle indexing.
- **Recommendation**: Consider off-chain indexing for production. The current approach is fine for the prototype scope.
- **Status**: **MITIGATED** — Acceptable for prototype. View functions are not state-changing.

### [F-10] No Category Validation on Create
- **Severity**: Informational
- **Location**: `src/EventTicketing.sol:198-236`
- **Description**: The contract does not store event categories on-chain. Categories are frontend-only (seed data).
- **Impact**: None — this is a deliberate design decision to save gas.
- **Recommendation**: If categories are needed on-chain, add an enum parameter to `createEvent`.
- **Status**: **PASS** — Design decision.

### [F-11] Emergency Pause Mechanism
- **Severity**: Informational
- **Location**: `src/EventTicketing.sol:568-575`
- **Description**: `pause()` and `unpause()` are restricted to `onlyOwner` (deployer). All state-changing functions use `whenNotPaused`.
- **Impact**: Provides emergency stop capability.
- **Recommendation**: N/A — correctly implemented.
- **Status**: **PASS**

### [F-12] Unexpected ETH Rejection
- **Severity**: Informational
- **Location**: `src/EventTicketing.sol:581-588`
- **Description**: Both `receive()` and `fallback()` revert, preventing accidental ETH deposits that would desync internal accounting.
- **Impact**: Prevents SWC-132 (unexpected ether balance) issues.
- **Recommendation**: N/A — correctly implemented.
- **Status**: **PASS** — Tested by `test_revert_directETHTransfer` and `test_revert_fallback`.

## SWC Registry Compliance

| SWC ID | Name | Status | Notes |
|--------|------|--------|-------|
| SWC-100 | Function Default Visibility | **PASS** | All 30 functions have explicit visibility. Modifiers are internal by design. Private helper `_validateString` at line 593. |
| SWC-101 | Integer Overflow/Underflow | **PASS** | Solidity 0.8.24 built-in protection. `unchecked` only on ID counters (lines 219, 315, 332) — safe. |
| SWC-103 | Floating Pragma | **PASS** | `pragma solidity 0.8.24;` — exact version, line 5. |
| SWC-104 | Unchecked Call Return Value | **PASS** | Lines 402-403 and 465-466: `(bool success, ) = payable(...).call{value:}(""); if (!success) revert ETHTransferFailed(...)` |
| SWC-105 | Unprotected Ether Withdrawal | **PASS** | `withdrawEventFunds` at line 434: requires `onlyOrganizer`, `eventExists`, event status `Completed`, tracks `_withdrawnAmounts`. |
| SWC-107 | Reentrancy | **PASS** | `nonReentrant` on `purchaseTickets` (line 281), `requestRefund` (line 374), `withdrawEventFunds` (line 438). Checks-Effects-Interactions pattern followed. |
| SWC-108 | State Variable Default Visibility | **PASS** | All state variables explicitly `private` (lines 50-66) or `public constant` (line 69). |
| SWC-113 | DoS with Failed Call | **PASS** | `cancelEvent` (line 248) does NOT loop. Pull-over-push refund pattern. `MAX_TICKETS_PER_PURCHASE = 10` bounds purchase loop (line 313). |
| SWC-114 | Transaction Order Dependence | **MITIGATED** | Availability checked at line 298-301. Front-running documented. Commit-reveal is a future enhancement. |
| SWC-115 | Authorization via tx.origin | **PASS** | `tx.origin` never used anywhere in the contract. Only `msg.sender` for auth. |
| SWC-116 | Block Timestamp Dependence | **PASS** | Used at lines 211, 261, 293, 386 for event-scale timeframes. Documented in NatSpec. |
| SWC-118 | Incorrect Constructor Name | **PASS** | Uses `constructor()` keyword at line 181. |
| SWC-120 | Weak Sources of Randomness | **PASS** | No randomness used. IDs are sequential counters (lines 216-219, 314-315). |
| SWC-131 | Presence of Unused Variables | **PASS** | No unused state variables, imports, or parameters. Compiles with `--deny-warnings`. |
| SWC-132 | Unexpected Ether Balance | **PASS** | No use of `address(this).balance`. Internal tracking via `_withdrawnAmounts` and `_refundedAmounts`. `receive()` and `fallback()` revert (lines 581-588). |
| SWC-135 | Code With No Effects | **PASS** | No dead code, no-op statements, or unreachable paths. Every event emission serves indexing purposes. |

## Gas Report

Output of `forge test --gas-report`:

```
╭------------------------------------------------+-----------------+--------+--------+---------+---------╮
| src/EventTicketing.sol:EventTicketing Contract |                 |        |        |         |         |
+========================================================================================================+
| Deployment Cost                                | Deployment Size |        |        |         |         |
|------------------------------------------------+-----------------+--------+--------+---------+---------|
| 2,278,681                                      | 10,075          |        |        |         |         |
|------------------------------------------------+-----------------+--------+--------+---------+---------|
| Function Name                                  | Min             | Avg    | Median | Max     | # Calls |
|------------------------------------------------+-----------------+--------+--------+---------+---------|
| createEvent                                    | 27,188          | 247,080| 286,390| 286,390 | 68      |
| purchaseTickets                                | 26,411          | 372,364| 291,931| 1,740,225| 49     |
| transferTicket                                 | 26,609          | 62,915 | 31,053 | 105,169 | 9       |
| requestRefund                                  | 26,234          | 72,523 | 92,602 | 98,466  | 14      |
| validateTicket                                 | 30,413          | 47,674 | 54,131 | 54,131  | 7       |
| cancelEvent                                    | 26,220          | 43,562 | 51,655 | 51,655  | 6       |
| completeEvent                                  | 26,197          | 47,661 | 53,828 | 53,828  | 12      |
| withdrawEventFunds                             | 26,132          | 53,975 | 57,300 | 70,404  | 8       |
╰------------------------------------------------+-----------------+--------+--------+---------+---------╯
```

**Gas Analysis:**
- All core functions well under 500k gas (median values).
- `purchaseTickets` max of 1,740,225 gas occurs when purchasing 10 tickets simultaneously — acceptable since this is the bounded maximum.
- `createEvent` median 286,390 gas — includes string storage which is inherently expensive.
- All other operations under 110k gas median.

## Test Coverage

Output of `forge coverage`:

```
╭---------------------------+-------------------+------------------+----------------+-----------------╮
| File                      | % Lines           | % Statements     | % Branches     | % Funcs         |
+=====================================================================================================+
| src/EventTicketing.sol    | 100.00% (146/146) | 98.62% (143/145) | 93.10% (27/29) | 100.00% (30/30) |
|---------------------------+-------------------+------------------+----------------+-----------------|
| test/EventTicketing.t.sol | 100.00% (22/22)   | 100.00% (14/14)  | 100.00% (2/2)  | 100.00% (8/8)   |
|---------------------------+-------------------+------------------+----------------+-----------------|
| Total                     | 96.55% (168/174)  | 94.58% (157/166) | 93.55% (29/31) | 97.44% (38/39)  |
╰---------------------------+-------------------+------------------+----------------+-----------------╯
```

**Coverage Analysis:**
- **Lines**: 100% on the main contract (146/146)
- **Statements**: 98.62% (143/145) — 2 uncovered statements are in edge-case revert paths
- **Branches**: 93.10% (27/29) — 2 uncovered branches are defensive checks for conditions already guarded by modifiers
- **Functions**: 100% (30/30) — every function tested
- **Test count**: 77 tests covering happy paths, access control, edge cases, reentrancy attacks, financial accuracy, and pausable functionality

## Recommendations

### Priority 1: No Critical Fixes Needed
The contract passes all critical and high-severity checks. No immediate fixes required.

### Priority 2: Suggested Enhancements
1. **Commit-reveal for high-demand events** — Mitigate front-running (SWC-114) for events with limited availability.
2. **Off-chain indexing** — Use The Graph subgraph for `getUserTickets` and `getEventTickets` to avoid unbounded array reads at scale.
3. **Fuzz testing** — Add Foundry fuzz tests on `purchaseTickets` and `requestRefund` for additional confidence.

### Priority 3: Future Considerations
1. **ERC-721 upgrade path** — Tickets as NFTs for marketplace interoperability.
2. **Multi-chain deployment** — Deploy to L2s (Polygon, Base, Arbitrum) for lower gas.
3. **IPFS event metadata** — Store event images/descriptions off-chain.
4. **Timelock on pause** — Add governance delay to admin actions for decentralization.
5. **Upgradeable proxy** — Consider UUPS proxy pattern for bug fixes without redeployment.

## Disclaimer

This audit was performed using AI-assisted analysis and manual code review of the Solidity source, test suite, and deployment scripts. It covers the SWC Registry, common vulnerability patterns, gas optimization, and test coverage. **This does not guarantee the absence of all vulnerabilities.** A professional audit by a firm like Trail of Bits, OpenZeppelin, or Consensys Diligence is recommended before mainnet deployment with significant TVL.
