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
- Partner Onboarding: $4.8387 deducted, added to MB1 Upgrade Savings & Net Profit
- MB payouts: $4.8387 savings deduction, 2-direct minimum, 62-spot completion gate
- GM payouts: 10% deduction applied
- Withdrawal: USDT → MERQ at live rates, 5% fee, minimum $1, pre-flight treasury check, generic "Withdrawal Failed !!!" error
- **MERQAi Subscription Deductions**: Displayed on Withdraw page from shared `ai_wallet_balance_ledger` collection
- Treasury on-chain payout via BSC
- Comprehensive Admin Panel with RBAC, audit logs, member management
- Admin "View As" impersonation
- Port income daily accrual cron
- Marketing landing page
- **Important Links**: Admin CRUD with image upload (Emergent Object Storage) + Member showcase page
- **MerqON Ecosystem menu** (expandable sidebar with 7 sub-pages):
  - MerqON AI, Token Insights, AI Trade Engine (Algo), Decentralised Wallet, MerqON Pay (Crypto Card), Whitepaper, Refer & Earn
  - All pages have "Coming Soon" placeholder layouts ready for content

## Key Collections
- `members`, `matrix`, `mb_state`, `transactions`, `withdrawals`, `techpass`, `port_purchases`, `important_links`
- `ai_wallet_balance_ledger` (shared with MERQAi — subscription deductions)
- `ai_subscriptions` (shared with MERQAi — plan details)

## Pending / In Progress
- P0: Full MB/GM algorithm transposition from simulation to live income_engine.py

## Upcoming / Future
- P1: Smart Contracts deployment (NFO.sol, Membership.sol)
- P1: Blockchain transaction monitoring and reconciliation workers
- P2: Ecosystem page content (user will provide)
- P2: Link categories for Important Links
- P2: Treasury low-balance admin alerts
- P2: Date-range filtering on MERQAi deductions
