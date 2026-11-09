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
- Withdrawal system converting USDT → MERQ at live rates minus 5% fee
- Treasury on-chain payout via BSC
- Comprehensive Admin Panel with RBAC, audit logs, member management
- Admin "View As" impersonation
- Port income daily accrual cron
- Marketing landing page
- **Important Links**: Admin CRUD with image upload (Emergent Object Storage) + Member showcase page (NEW)
- **Withdrawal safety**: Pre-flight treasury check blocks withdrawals instantly if MERQ/BNB is low; generic "Withdrawal Failed !!!" error shown to members (NEW)

## Key Collections
- `members`: User profiles, income tracking, network stats
- `matrix`: MLM tree nodes (MB1-8, GM boards)
- `transactions`: Immutable ledger
- `withdrawals`: Withdrawal requests with status tracking
- `techpass`, `port_purchases`: Purchase records
- `important_links`: Admin-managed links with image paths (NEW)

## Pending / In Progress
- P0: Apply new MB/GM business rules to live `income_engine.py` (2-direct requirement, $4.8387 savings deduction, 62-spot completion, 10% GM deduction) — simulation script done, needs transposition to production code

## Upcoming / Future
- P1: Smart Contracts deployment (NFO.sol, Membership.sol)
- P1: Blockchain transaction monitoring and reconciliation workers
- P2: Link categories for Important Links
- P2: Treasury low-balance admin alerts
