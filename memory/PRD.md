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

## Admin Panel (2026-06, separate /admin shell)
- Separate secure console at /admin with wallet-signature login + RBAC (6 roles: SUPER_ADMIN, FINANCE_ADMIN, MLM_ADMIN, OPERATIONS_ADMIN, SUPPORT_ADMIN, VIEW_ONLY) and immutable audit logging.
- Super Admin seeded: admin@merqon.io bound to wallet 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Demo Super Admin Wallet button).
- Modules (full depth): Dashboard (KPIs+charts), Members + Member Detail (actions/notes), MLM Network (sponsor/placement trees), Leaderboard, Rank Management, Deposits, Withdrawals (approval queue w/ auto-approve threshold), Income (ranged), Reconciliation, Profit Growth, Commission, Rewards (editable tiers), Autopool, Token & Blockchain, Treasury, Liquidity, Business Rules (versioned), Reports (+CSV export), Notifications, Support tickets, Admin Users & Roles (RBAC matrix), Audit Logs, System Health, System Settings, Emergency Center (gated controls).
- Withdrawal flow changed: requests above withdraw_auto_approve_under become pending (admin approve/reject); small ones auto-complete.
- Token/Treasury/Liquidity/Reconciliation are SIMULATED monitoring (no live BSC in v1).
- Backend: /app/backend/admin_panel.py (build_admin_router + RBAC + audit). Frontend: /app/frontend/src/admin/*.
- Testing: 47/47 admin backend tests PASS + full admin frontend e2e PASS (iteration_2.json). Member DApp regression green.

## Marketing Landing Page (2026, from company profile)
- Premium black + luxury-gold marketing site at "/" built from the MerqON company profile (Build to Connect).
- Generated brand assets: MerqON logo emblem + gold globe hero (hosted URLs in MarketingLanding.jsx).
- Sections: Hero (Building a Connected Digital Ecosystem), 4 pillars (AI Solutions, Algorithmic Trading, Digital Utility, Tokenomics), Introducing MerqON AI + 3 core segments + mission, AI Platform (6 capabilities), Algorithmic Trading Infrastructure (5 components + risk note), MERQ Tokenomics, Future Utility Roadmap (4 phases + vision), CTA + footer with disclaimers.
- Routing change: "/" = MarketingLanding; DApp wallet-connect moved to "/app" (and "/register?ref="); Protected redirects to "/app". "Launch App" CTAs link to /app.
- File: /app/frontend/src/pages/MarketingLanding.jsx. Static content, no backend dependency.

## 2026-06 Update
- Owner wallet 0xc1aCA21ABDfdBF0730e73B56fe949cD2703e63ad whitelisted as SUPER_ADMIN via OWNER_ADMIN_WALLETS env (startup seed: admin_users, settings.admin_addresses, members.is_admin).
- Removed all demo wallet logins (member + admin UI). Public Hardhat demo key's admin access revoked; remains network root only. Legacy admin_member now also requires an active admin_users entry.
- Signup now requires a registered sponsor (wallet address or pasted referral link, auto-extracted & live-validated via GET /api/auth/lookup/{address}). Existing members log in without sponsor; admin wallets exempt. /register?ref= prefills sponsor.
- Landing page: Live algo chart (BNB/USDT via Binance data-api, MA7/MA25 crossover sample signals), live market volume (6 pairs), MerqAI revenue structure (SAMPLE %), MERQ token allocation donut (SAMPLE 1B supply). Endpoints: GET /api/market/klines, /api/market/volume. Sample numbers live in components/landing/RevenueStructure.jsx & TokenAllocation.jsx.
- Member Swap page (/swap): REAL on-chain USDT<->MERQ via PancakeSwap V2 (ethers, MetaMask). Flow: fee transfer to fee wallet -> approve -> swapExactTokensForTokensSupportingFeeOnTransferTokens. States: not_live (no MERQ address), no_pool, disabled, ready. Backend: GET /api/swap/config, POST /api/swap/record (checks receipt via BSC RPC), GET /api/swap/history; Admin GET/PUT /api/admin/swap (module token) at /admin/swap — MERQ contract, fee wallet, fee % (default 0.1), slippage, router/factory/USDT/RPC. Verified quotes against real CAKE/USDT pool. Not done: sidebar MERQ price still admin-set, not pool price.
- Member income restructured: old Income/Autopool/Rewards pages removed from member app. New grouped menu + dashboard: Merq TechPass (Partner Onboarding, Momentum Booster, Global Momentum) and Merq Entry & Unity Port (Partner Onboarding Rewards, Level Income, Rank & Rewards). Pages /income/:slug. APIs GET /api/income/streams, /api/income/stream/{key} (keys tp_*, port_*). Earning RULES PENDING from user — all show 0. Old backend income engine still exists.
