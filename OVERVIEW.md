# ChainTix — Project Overview

# Ouick Overview

My event ticketing dApp uses NFT-based tickets with on-chain transfer restrictions and QR verification to eliminate counterfeiting and scalping. I built it to dig into token standards, access control patterns, and the security considerations around minting, ownership, and validation logic.

## Security Focus:

This project is my way of learning blockchain security from the builder's side understanding vulnerabilities like reentrancy, access control gaps, and input
validation by writing the contracts myself and auditing them against real checklists like SWC and the Solidity security best practices.

## What is ChainTix?

ChainTix is a decentralized event ticketing platform built on Ethereum. It replaces traditional ticketing intermediaries (Ticketmaster, Eventbrite, StubHub) with a smart contract that handles the entire ticket lifecycle — creation, purchase, transfer, refund, validation, and revenue withdrawal — directly on-chain.

The tagline says it all: **Your Ticket. Your Wallet. Your Proof.**

## The Problem

Traditional event ticketing is broken:

- **Hidden fees** — Service fees, processing fees, and facility charges can add 25-40% to ticket prices
- **No transparency** — Buyers can't verify how many tickets exist, how many are sold, or where revenue goes
- **Counterfeit risk** — Paper and PDF tickets are trivially duplicated
- **No true ownership** — You don't own your ticket; you own a license that can be revoked
- **Refund friction** — Getting a refund requires customer support, waiting periods, and partial amounts
- **Scalper-friendly** — Centralized platforms profit from secondary market markups

## The Solution

ChainTix puts every ticket on the Ethereum blockchain:

| Traditional Ticketing | ChainTix |
|----------------------|----------|
| Service fees (25-40%) | Gas only (~$0.50-$2) |
| Opaque inventory | On-chain ticket count, verifiable by anyone |
| PDF/barcode tickets | Wallet-based ownership, cryptographically proven |
| Refunds via customer support | Self-service refund before organizer-set deadline |
| Revenue held by platform for weeks | Organizer withdraws directly after event |
| Centralized control | Smart contract rules, no admin override |

## How It Works

### For Attendees

1. **Connect wallet** — MetaMask or any Ethereum wallet
2. **Browse events** — Filter by category (Music, Sports, Tech, Arts, Comedy, Conferences)
3. **Purchase tickets** — Pay exact ticket price in ETH, get on-chain proof instantly
4. **Transfer or refund** — Send your ticket to any address, or request a refund before the deadline
5. **Attend** — Organizer validates your ticket on-chain at the door

### For Organizers

1. **Create event** — Set name, description, venue, date, price, capacity, and refund window
2. **Sell tickets** — Attendees purchase directly through the smart contract
3. **Validate at entry** — Mark tickets as used on-chain (prevents re-entry)
4. **Withdraw revenue** — After marking the event complete, withdraw ETH directly to your wallet

### Smart Contract Lifecycle

```
Create Event → Tickets Available → Purchase → [Transfer / Refund] → Validate → Complete → Withdraw
                                                                        ↓
                                                              Cancel → Refunds Enabled
```

## Architecture

ChainTix is a two-layer application:

### Layer 1: Smart Contract (Solidity)

A single `EventTicketing.sol` contract (602 lines) deployed on Ethereum handles all business logic. It inherits from three OpenZeppelin contracts:

- **ReentrancyGuard** — Prevents reentrancy attacks on all ETH-transferring functions
- **Pausable** — Emergency stop mechanism controlled by the contract owner
- **Ownable** — Admin access control for pause/unpause

Key design decisions:
- Tickets are tracked via mappings (not ERC-721) for simpler logic and cheaper gas
- Pull-over-push refund pattern prevents DoS when events are canceled
- Exact payment required (no overpayment/change logic)
- Sequential IDs for events and tickets (no randomness needed)
- Internal balance tracking — never relies on `address(this).balance`

### Layer 2: Frontend (React + TypeScript)

A single-page application built with React 18, TypeScript, Vite, and ethers.js v6. The frontend connects to the user's wallet via `window.ethereum` (MetaMask) and interacts with the deployed contract.

Key features:
- Light/dark mode with system preference detection
- Category filtering with animated transitions (Framer Motion)
- Real-time wallet state management (account changes, network switching)
- Human-readable error messages for all 20+ contract revert conditions
- Responsive design (375px — 1440px)

## Security Posture

The contract was audited against the **SWC Registry** (Smart Contract Weakness Classification), covering 15+ vulnerability classes. All checks pass except SWC-114 (front-running), which is documented and mitigated by design.

**Test suite**: 77 Foundry tests covering happy paths, access control, edge cases, reentrancy attacks, financial accuracy, and pausable functionality.

**Coverage**: 100% line coverage, 93.10% branch coverage, 100% function coverage.

See [`audit/SECURITY_AUDIT.md`](audit/SECURITY_AUDIT.md) for the full smart contract audit report and [`audit/FRONTEND_SECURITY.md`](audit/FRONTEND_SECURITY.md) for the frontend security assessment.

## Who Built This

ChainTix was built by **Stefan James** as a portfolio project demonstrating full-stack blockchain development and smart contract security. It covers the complete dApp development lifecycle: Solidity smart contract, Foundry testing, security auditing, React frontend, and CI/CD.

## License

MIT
