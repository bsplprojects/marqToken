# MerqON — Product Requirements Document

## Original Problem Statement
Build "MerqON" as a Web3 membership + token utility platform. Features include a decentralized MLM/network mechanic, configurable profit growth, rewards, and autopools.

## Core Stack
- **Frontend**: React (CRA + craco), Tailwind CSS, ethers.js, Tanstack Query
- **Backend**: FastAPI, PyJWT, eth-account, Web3.py, Motor (async MongoDB)
- **Database**: MongoDB Atlas (production), local MongoDB (dev)
- **Auth**: Wallet-only (MetaMask/WalletConnect), no email/passwords

## What's Been Implemented
- Full DApp with wallet login, dashboard, network, board trees
- TechPass, Entry/Unity Port purchase flows
- Momentum Booster (MB1-8) matrix networks
- Global Momentum (GM) company-wide matrix tree
- Income engine with USDT-based internal accounting
- **Partner Onboarding**: $4.8387 deducted per payout, added to MB1 Upgrade Savings; net amount adds to MB1 Net Profit
- MB payouts: $4.8387 savings deduction, 2-direct minimum, 62-spot completion gate
- GM payouts: 10% deduction applied
- Withdrawal system: USDT → MERQ at live rates, 5% fee, **minimum $1**
- **Withdrawal safety**: Pre-flight treasury check (MERQ & BNB); generic "Withdrawal Failed !!!" error; auto-refund on payout failure
- Treasury on-chain payout via BSC
- Comprehensive Admin Panel with RBAC, audit logs, member management
- Admin "View As" impersonation
- Port income daily accrual cron
- Marketing landing page
- **Important Links**: Admin CRUD with image upload (Emergent Object Storage) + Member showcase page

## Key Collections
- `members`: User profiles, income tracking, network stats
- `matrix`: MLM tree nodes (MB1-8, GM boards)
- `mb_state`: Per-member per-board net profit, savings, filled spots, upgrade status
- `transactions`: Immutable ledger
- `withdrawals`: Withdrawal requests with status tracking
- `techpass`, `port_purchases`: Purchase records
- `important_links`: Admin-managed links with image paths

## Pending / In Progress
- P0: Full MB/GM algorithm transposition from simulation to live income_engine.py (partially done — partner onboarding savings now live)

## Upcoming / Future
- P1: Smart Contracts deployment (NFO.sol, Membership.sol)
- P1: Blockchain transaction monitoring and reconciliation workers
- P2: Link categories for Important Links
- P2: Treasury low-balance admin alerts
- P2: Income breakdown showing savings deduction on member dashboard
