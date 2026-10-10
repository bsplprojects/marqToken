# MerqON — Product Requirements Document

## Problem Statement
A Web3 membership + token-utility platform on BNB Smart Chain (token: MERQ, BEP-20) with
MLM/network mechanics implemented transparently with configurable rules (no hard-coded
guaranteed-return promises). Branding: MerqON — "Build for everyone".

## User Choices
- Branding: MerqON (token MERQ)
- Scope v1: Full DApp + FastAPI + MongoDB, mechanics simulated off-chain (configurable rules, DB ledger)
- Auth: REAL MetaMask/WalletConnect nonce-signature login + JWT
- Price: admin-configurable MERQ price + live CoinGecko BNB reference
- Admin panel: yes
- Theme: premium, international DeFi aesthetic (dark obsidian + BNB gold + emerald)

## Architecture
- Frontend: React (CRA/craco), ethers v6 for wallet connect/signing, react-query, Tailwind, shadcn/ui, recharts, sonner, lucide
- Backend: FastAPI, eth-account for EIP-191 signature recovery, PyJWT (HS256, 7d)
- DB: MongoDB (members, nonces, settings, transactions, positions, autopool)
- Auth: /api/auth/nonce -> sign -> /api/auth/verify -> JWT. Admin by seeded address.

## Personas
- Member: connects wallet, deposits MERQ, builds referral/binary network, earns & withdraws.
- Admin: configures protocol rules, monitors analytics, manages member status.

## Implemented (2026-06)
- Wallet-signature auth (MetaMask + in-app Demo Member/Admin wallets), auto-register w/ sponsor + binary placement
- Member dashboard: MERQ balance, fiat value, wallet balance, 5 income stream cards, network overview
- Dual network trees: sponsor (referral) + binary placement; left/right counts & volume; directs table
- Income engine: Referral %, Profit Growth (daily accrual + claim), PG Commission, Achievement Rewards, Autopool matrix
- Deposit (approve + deposit two-step), Withdraw (fees, min, daily limit, cooldown, validations)
- Transactions + income history with BscScan links; CoinGecko BNB price
- Admin panel: configurable rules (referral/growth/pool/fees/limits/price), member status, analytics, income distribution
- Premium dark/gold theme, responsive, data-testids throughout
- Admin seed: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (network root)
- Testing: 30/30 backend pytest PASS, frontend e2e PASS (iteration_1.json)

## Backlog / Next (P1/P2)
- Real Solidity contracts (NFO/Membership/Referral/Growth/Commission/Reward/AutoPool/Treasury) + BSC deploy + multisig (P1)
- On-chain sponsor recording + MongoDB indexed mirror (P1)
- WalletConnect v2 (Reown) full integration for mobile (P2)
- Split server.py by domain; async httpx for CoinGecko; settings key validation; nonce rate-limiting (P2)
- Rank progression rewards, PG commission multi-level, autopool re-entry depth visualization (P2)

## Notes / Mocked
- MOCKED: on-chain layer is simulated off-chain in MongoDB; tx hashes are placeholders (BscScan-format links); token deposits/transfers are simulated, not real BEP-20 transfers.
