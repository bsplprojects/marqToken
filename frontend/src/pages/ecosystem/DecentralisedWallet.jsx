import { PageHeader } from "@/components/PageHeader";
import {
  Wallet, Shield, Globe, Smartphone, Key, Send, ArrowLeftRight,
  Layers, Eye, Lock, QrCode, BarChart3, History, Image, Settings,
  Zap, Users, Rocket, CheckCircle2, AlertTriangle, ChevronRight,
  CircleDot, Coins, Brain, Activity, Building2, Handshake,
  Fingerprint, FileText, MonitorSmartphone, Box, Server,
} from "lucide-react";

const HERO_IMG = "/images/merq-wallet-hero.jpg";

/* ─── How It Works ─── */
const HOW_STEPS = [
  { step: "01", title: "Create a Self-Custody Wallet", desc: "A wallet generates keys and a recovery phrase on the user's device.", icon: Key, color: "violet" },
  { step: "02", title: "Connect to a Blockchain", desc: "The app reads blockchain data through network infrastructure.", icon: Globe, color: "cyan" },
  { step: "03", title: "Prepare a Transaction", desc: "The user chooses an asset, recipient and transaction details.", icon: FileText, color: "amber" },
  { step: "04", title: "Review & Sign", desc: "The transaction is shown to the user and signed locally with the private key.", icon: Fingerprint, color: "emerald" },
  { step: "05", title: "Broadcast & Confirm", desc: "The signed transaction is sent to the network for processing.", icon: Send, color: "rose" },
];

/* ─── Key Features ─── */
const FEATURES = [
  { title: "Multi-Crypto Asset Support", desc: "View and manage supported cryptocurrencies and tokens from one wallet interface.", icon: Coins },
  { title: "Multi-Chain Support", desc: "Access selected blockchain networks, subject to network and token compatibility.", icon: Globe },
  { title: "Send & Receive", desc: "Send assets to blockchain addresses and receive assets using wallet addresses or QR codes.", icon: Send },
  { title: "Token Swap", desc: "Swap supported assets through integrated decentralized exchanges or third-party swap providers.", icon: ArrowLeftRight },
  { title: "Web3 & dApp Connectivity", desc: "Connect to compatible decentralized applications using reviewed connection standards.", icon: Layers },
  { title: "Portfolio Dashboard", desc: "View supported asset balances, token prices where available and portfolio summaries.", icon: BarChart3 },
  { title: "Transaction History", desc: "Review transaction details, statuses, network fees and blockchain references.", icon: History },
  { title: "NFT Support", desc: "View and manage supported NFTs and collectibles where the relevant network is integrated.", icon: Image },
  { title: "Security Controls", desc: "Use local authentication, transaction review and secure key-storage measures.", icon: Shield },
  { title: "MERQ Ecosystem Integration", desc: "Connect with supported MERQ products and services through explicit user-approved integrations.", icon: Zap },
];

/* ─── User Benefits ─── */
const USER_BENEFITS = [
  { title: "Control Over Digital Assets", desc: "Users retain control of their private keys and recovery phrase rather than relying on MERQ to hold their assets.", icon: Key },
  { title: "One App for Supported Assets", desc: "Users can manage supported tokens and networks through a single interface.", icon: Smartphone },
  { title: "Direct Blockchain Transactions", desc: "Users can send and receive assets using blockchain addresses without requiring MERQ to custody the funds.", icon: Send },
  { title: "Access to Web3 Services", desc: "Users can connect to supported dApps and decentralized services from the wallet.", icon: Globe },
  { title: "Convenient Token Swaps", desc: "Users may swap supported assets through integrated providers, subject to availability, fees and network conditions.", icon: ArrowLeftRight },
  { title: "Transaction Visibility", desc: "Users can review transaction activity and access blockchain transaction references.", icon: Eye },
  { title: "Mobile Accessibility", desc: "Android and iOS applications are planned to make wallet access convenient across common mobile devices.", icon: MonitorSmartphone },
];

/* ─── Ecosystem Map ─── */
const ECO_BENEFITS = [
  { title: "Stronger Product Integration", desc: "A shared wallet experience can connect users to MERQ Token, MERQ AI and future Web3 products." },
  { title: "MERQ Token Utility", desc: "The wallet can make it easier to view, hold, send and receive MERQ Token on its supported blockchain network." },
  { title: "Ecosystem Engagement", desc: "Users may return to the wallet to manage assets and access supported services." },
  { title: "New Business Revenue", desc: "Swap-related service fees, optional premium subscriptions and commercial partnerships can create wallet-specific revenue." },
  { title: "Independent Product Growth", desc: "MERQ Wallet can build its own user base and brand identity while supporting the wider MERQ ecosystem." },
  { title: "Improved User Experience", desc: "A unified interface may reduce friction when users move between compatible ecosystem services." },
];

/* ─── Revenue Model ─── */
const REVENUE = [
  { num: "01", stream: "Swap Fees", desc: "MERQ may earn a clearly disclosed service or routing fee when users swap supported tokens through integrated swap providers or decentralized exchange routes.", transparency: "Show provider fees, network gas and applicable charges.", icon: ArrowLeftRight },
  { num: "02", stream: "Premium Subscription", desc: "An optional paid plan may provide additional convenience or advanced features such as enhanced portfolio analytics, advanced transaction views, custom alerts or expanded reporting.", transparency: "Publish plan features, price and renewal terms.", icon: Zap },
  { num: "03", stream: "Partnership Revenue", desc: "MERQ may earn referral, integration or commercial partnership fees from third-party Web3 services, dApps or infrastructure providers.", transparency: "Disclose sponsored and referral relationships.", icon: Handshake },
];

/* ─── Revenue Principles ─── */
const PRINCIPLES = [
  { title: "Transparent Pricing", desc: "Disclose MERQ service fees, third-party provider charges, network fees and subscription costs before users confirm relevant actions." },
  { title: "Optional Premium Services", desc: "Premium subscriptions should be optional and should not misrepresent basic wallet security or access as paid-only benefits." },
  { title: "No Custody-Based Revenue", desc: "The selected non-custodial model does not require MERQ to hold user funds." },
  { title: "Partner Due Diligence", desc: "Review partner reliability, security, legal status, data handling and commercial terms before integration." },
  { title: "No Hidden Transaction Routing", desc: "Explain how swap routes and providers are selected and disclose any commercial incentives." },
  { title: "User Consent & Privacy", desc: "Collect only necessary information and obtain appropriate consent for analytics, notifications and partner integrations." },
];

/* ─── Security ─── */
const SECURITY = [
  "Generate and manage wallet keys using established cryptographic standards and secure implementation practices.",
  "Keep private keys and recovery phrases under user control; do not ask users to share them with support staff or the MERQ team.",
  "Encrypt sensitive local wallet data and use secure storage facilities provided by supported mobile operating systems.",
  "Require clear transaction review and user authorization before signing or broadcasting transactions.",
  "Use biometric authentication or a device PIN as an access-control layer.",
  "Provide phishing warnings, malicious dApp risk notices and clear permission-review screens where feasible.",
  "Conduct independent security reviews, penetration testing and smart-contract or integration audits where applicable.",
  "Explain that blockchain transactions are generally irreversible and that users must verify recipient addresses and network details.",
];

/* ─── Roadmap ─── */
const ROADMAP = [
  { phase: "1", title: "Wallet Foundation", desc: "Define wallet architecture, key generation and recovery, security model, mobile application foundations and initial supported network.", icon: Box },
  { phase: "2", title: "Core Mobile Wallet", desc: "Build Android and iOS experiences for wallet creation, backup, asset display, send, receive and transaction history.", icon: Smartphone },
  { phase: "3", title: "Multi-Chain & Web3", desc: "Add additional supported networks, dApp connectivity, token swaps and carefully reviewed third-party integrations.", icon: Globe },
  { phase: "4", title: "MERQ Ecosystem Integration", desc: "Integrate MERQ Token and selected MERQ products through explicit, secure and user-approved workflows.", icon: Layers },
  { phase: "5", title: "Commercial Launch & Expansion", desc: "Introduce disclosed swap service fees, optional premium features and vetted partnership programs.", icon: Rocket },
];

/* ─── Specs ─── */
const SPECS = [
  { item: "Wallet Model", value: "Non-custodial / Self-custody" },
  { item: "Launch Platforms", value: "Android and iOS" },
  { item: "Core Purpose", value: "Manage supported crypto assets and access Web3 services" },
  { item: "Revenue Streams", value: "Swap fees, premium subscription and partnership revenue" },
  { item: "Blockchain Networks", value: "To be confirmed" },
  { item: "Supported Tokens", value: "To be confirmed" },
  { item: "Swap Provider", value: "To be selected and reviewed" },
  { item: "dApp Connection Standard", value: "To be confirmed" },
  { item: "Security Audit", value: "To be completed" },
  { item: "Premium Plan Pricing", value: "To be defined" },
];

/* ═══════════════════════════════════════════ */

function SectionTitle({ icon: Icon, children, sub }) {
  return (
    <div className="mb-7 pt-8 first:pt-0">
      <div className="flex items-center gap-3 mb-1.5">
        {Icon && <div className="h-10 w-10 rounded-xl bg-violet-400/10 flex items-center justify-center flex-shrink-0"><Icon className="h-5 w-5 text-violet-400" /></div>}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-white">{children}</h2>
      </div>
      {sub && <p className="text-slate-500 text-sm ml-[52px]">{sub}</p>}
    </div>
  );
}

const WC = { violet: "border-violet-400/30 bg-violet-400/10 text-violet-400",
  cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-400",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  rose: "border-rose-400/30 bg-rose-400/10 text-rose-400" };

export default function DecentralisedWallet() {
  return (
    <div data-testid="ecosystem-decentralised-wallet" className="max-w-5xl mx-auto">
      <PageHeader title="Decentralised Wallet" eyebrow="Ecosystem" subtitle="Product Introduction, Features & Revenue Model" />

      {/* ─── HERO ─── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/8 mb-10">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/60" />
        <div className="relative p-8 sm:p-12 lg:p-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-1.5 mb-6">
            <Wallet className="h-3.5 w-3.5 text-violet-400" />
            <span className="font-mono-merq text-[10px] uppercase tracking-widest text-violet-300">A Self-Custody Web3 Wallet</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4 max-w-2xl">
            Your Digital Assets.<br />Your <span className="text-violet-400">Control.</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mb-8">
            A mobile-first digital wallet designed to help users manage supported crypto assets, connect to blockchain networks and access Web3 services while retaining control of their private keys.
          </p>
          <div className="flex flex-wrap gap-3">
            {["Non-Custodial", "Android", "iOS"].map((t) => (
              <span key={t} className="rounded-full border border-violet-400/20 bg-violet-400/5 px-4 py-2 text-xs text-violet-300 font-semibold">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── WHAT IS A DECENTRALIZED WALLET ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Wallet} sub="An application that enables users to manage blockchain-based assets.">What Is a Decentralized Wallet?</SectionTitle>
        <p className="text-slate-400 text-sm leading-relaxed mb-5">
          A decentralized cryptocurrency wallet is an application that enables users to manage blockchain-based assets and interact with supported networks. In a non-custodial wallet, the user — not the wallet provider — controls the private keys. A wallet does not physically store cryptocurrency; digital assets are recorded on their respective blockchains. The wallet manages the cryptographic keys that allow the user to view balances and authorize transactions.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {["Cryptocurrency and supported token management.", "Sending and receiving digital assets.", "Multiple blockchain networks, where supported.", "Token swaps through integrated providers or DEXs.", "Decentralized applications (dApps) and Web3 services.", "NFT viewing and management, where supported."].map((c, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <CheckCircle2 className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 text-xs leading-relaxed">{c}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-400/5 p-4 flex items-start gap-3">
          <Lock className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-violet-200/70"><strong>Core Principle:</strong> MERQ Wallet is planned as a non-custodial wallet: users retain control of their recovery phrase and private keys. MERQ should not collect, store or request users' secret recovery phrases or private keys.</p>
        </div>
      </div>

      {/* ─── PRODUCT POSITIONING ─── */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Lock, title: "Non-Custodial by Design", desc: "Users control their wallet credentials and authorize transactions. The application provides the interface and supporting connectivity, not custody of user funds." },
          { icon: Smartphone, title: "Mobile-First Experience", desc: "The initial target platforms are Android and iOS, with a simple interface for wallet setup, asset visibility and transaction management." },
          { icon: Globe, title: "Web3 & Ecosystem Connectivity", desc: "The wallet is intended to connect with supported blockchain networks, dApps and MERQ products through carefully reviewed integrations." },
        ].map((p, i) => (
          <div key={i} className="glass rounded-2xl border border-white/8 p-6 hover:border-violet-400/20 transition-colors">
            <p.icon className="h-6 w-6 text-violet-400 mb-3" />
            <h3 className="text-white font-semibold text-sm mb-2">{p.title}</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Settings} sub="Cryptographic keys let users authorize blockchain transactions.">How Does It Work?</SectionTitle>
        <div className="space-y-4">
          {HOW_STEPS.map((w, i) => (
            <div key={w.step} className="group flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-violet-400/15 transition-colors">
              <div className={`flex-shrink-0 h-14 w-14 rounded-xl border flex items-center justify-center ${WC[w.color]}`}>
                <w.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono-merq text-[10px] text-violet-400">{w.step}</span>
                  <h3 className="text-white font-semibold text-sm">{w.title}</h3>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── KEY FEATURES ─── */}
      <div className="glass rounded-2xl border border-violet-400/10 p-6 sm:p-8 mb-8 bg-gradient-to-br from-violet-400/5 to-transparent">
        <SectionTitle icon={Zap} sub="Proposed product scope for MERQ Wallet.">Key Features</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-xl border border-white/8 bg-black/20 p-4 hover:border-violet-400/20 transition-all text-center">
              <f.icon className="h-5 w-5 text-violet-400 mx-auto mb-2" />
              <div className="text-white font-semibold text-xs mb-1">{f.title}</div>
              <div className="text-slate-500 text-[10px] leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── USER BENEFITS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Users} sub="Making self-custody and Web3 access more approachable.">Benefits for Users</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USER_BENEFITS.map((b) => (
            <div key={b.title} className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-violet-400/15 transition-colors">
              <b.icon className="h-5 w-5 text-violet-400 mb-3" />
              <h3 className="text-white font-semibold text-sm mb-1">{b.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ECOSYSTEM STRATEGY ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Layers} sub="A common Web3 access layer for the MERQ ecosystem.">Ecosystem Strategy</SectionTitle>
        {/* Ecosystem connection diagram */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {[
            { label: "MERQ Wallet", sub: "Self-custody access layer", active: true },
            { label: "MERQ Token", sub: "Hold / Send / Receive" },
            { label: "MERQ AI", sub: "Supported integrations" },
            { label: "AI Trade Engine", sub: "Wallet connection" },
            { label: "Future Web3", sub: "dApps & services" },
          ].map((e) => (
            <div key={e.label} className={`rounded-xl border p-4 text-center min-w-[140px] ${e.active ? "border-violet-400/30 bg-violet-400/10" : "border-white/8 bg-white/[0.02]"}`}>
              <div className={`font-semibold text-xs mb-0.5 ${e.active ? "text-violet-300" : "text-white"}`}>{e.label}</div>
              <div className="text-slate-500 text-[10px]">{e.sub}</div>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ECO_BENEFITS.map((b) => (
            <div key={b.title} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <CheckCircle2 className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <div><div className="text-white font-semibold text-xs mb-0.5">{b.title}</div><div className="text-slate-500 text-[10px] leading-relaxed">{b.desc}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── REVENUE MODEL ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={BarChart3} sub="Three potential revenue streams: swap fees, subscriptions and partnerships.">Revenue Model</SectionTitle>
        <div className="space-y-4 mb-6">
          {REVENUE.map((r) => (
            <div key={r.num} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-lg bg-violet-400/10 flex items-center justify-center"><r.icon className="h-4 w-4 text-violet-400" /></div>
                <div><span className="font-mono-merq text-[10px] text-violet-400 mr-2">{r.num}</span><span className="text-white font-semibold text-sm">{r.stream}</span></div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed mb-2">{r.desc}</p>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <span className="font-mono-merq text-[9px] uppercase tracking-widest text-slate-500">Transparency: </span>
                <span className="text-slate-400 text-[11px]">{r.transparency}</span>
              </div>
            </div>
          ))}
        </div>
        <h4 className="text-white font-semibold text-sm mb-3">Operating Principles</h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="text-violet-400 font-semibold text-xs mb-1">{p.title}</div>
              <div className="text-slate-500 text-[10px] leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECURITY ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Shield} sub="Security is a foundational requirement for a non-custodial wallet.">Security, Privacy & User Responsibilities</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {SECURITY.map((s, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <CheckCircle2 className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 text-xs leading-relaxed">{s}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-4 flex items-start gap-3">
          <Shield className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-violet-200/70"><strong>Security Promise:</strong> MERQ should never request a user's recovery phrase or private keys. Users should verify every transaction and keep a secure offline backup of their recovery phrase.</p>
        </div>
      </div>

      {/* ─── ROADMAP ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Rocket} sub="A non-custodial mobile wallet for Android and iOS.">Development Roadmap</SectionTitle>
        <div className="relative">
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-violet-400/40 via-violet-400/20 to-transparent" />
          <div className="space-y-6">
            {ROADMAP.map((r) => (
              <div key={r.phase} className="relative flex items-start gap-5 pl-1">
                <div className="relative z-10 flex-shrink-0 h-12 w-12 rounded-full bg-slate-900 border-2 border-violet-400/40 flex items-center justify-center">
                  <r.icon className="h-5 w-5 text-violet-400" />
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-merq text-[10px] text-violet-400">Phase {r.phase}</span>
                    <span className="text-white font-semibold text-sm">{r.title}</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── PRODUCT SPECS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Server} sub="Product decisions and items to confirm before public release.">Product Specifications</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          {SPECS.map((s) => (
            <div key={s.item} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex items-center justify-between gap-3">
              <span className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{s.item}</span>
              <span className="text-white text-xs font-semibold text-right">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CONCLUSION ─── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/8 mb-8">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-400/5 via-transparent to-violet-400/5" />
        <div className="relative p-8 sm:p-12 text-center">
          <Wallet className="h-12 w-12 text-violet-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-3">Your Decentralized Future</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto mb-4">
            To build a user-friendly, non-custodial wallet that gives people control over supported digital assets and provides a trusted gateway to the expanding MERQ and Web3 ecosystems.
          </p>
          <div className="font-display text-lg font-bold text-violet-400">One Wallet. Multiple Blockchains. A Connected Web3 Experience.</div>
          <p className="text-slate-500 text-xs mt-6 italic max-w-lg mx-auto">
            This document is an informational product profile. It is not financial, investment, legal or tax advice. Cryptocurrency and blockchain interactions involve risks, including loss of funds and irreversible transactions. No security outcome, revenue, adoption level or commercial result is guaranteed.
          </p>
        </div>
      </div>
    </div>
  );
}
