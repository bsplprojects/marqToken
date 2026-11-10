import { PageHeader } from "@/components/PageHeader";
import {
  Coins, Wallet, Globe, Users, Rocket, Shield, BarChart3, Lock,
  ArrowRight, CheckCircle2, AlertTriangle, Layers, Zap, Target,
  Building2, Handshake, Gem, PiggyBank, Code2, TrendingUp,
  ChevronRight, Eye, FileText, Send, Box, CircleDot,
} from "lucide-react";

const HERO_IMG = "/images/merq-token-hero.jpg";

/* ─── Utility Areas ─── */
const UTILITY = [
  { area: "Ecosystem Payments", desc: "Payment for services or digital products that officially support MERQ.", icon: Coins },
  { area: "Platform Access", desc: "Access to eligible platform features or services, subject to published rules.", icon: Lock },
  { area: "Community Rewards", desc: "Incentives for qualifying community activities under transparent program terms.", icon: Users },
  { area: "Ecosystem Participation", desc: "Participation in supported programs and initiatives where applicable.", icon: Layers },
  { area: "Digital Transactions", desc: "Transfer between compatible wallets and supported applications.", icon: Send },
  { area: "Future Integrations", desc: "Additional integrations as products, partnerships and technical capabilities develop.", icon: Zap },
];

/* ─── How It Works ─── */
const HOW = [
  { step: "01", title: "Digital Wallet", desc: "Users hold and manage MERQ Tokens through a compatible wallet. Wallet access and security remain the responsibility of the user.", icon: Wallet },
  { step: "02", title: "Blockchain Network", desc: "Token transactions are submitted to the supported blockchain network and recorded according to that network's rules.", icon: Globe },
  { step: "03", title: "Token Transactions", desc: "Users may transfer tokens or use them in services that have integrated MERQ Token functionality.", icon: Send },
  { step: "04", title: "MERQ Ecosystem", desc: "The token may support eligible ecosystem utilities, participation programs and services as those functions are implemented.", icon: Layers },
];

/* ─── Holder Benefits ─── */
const BENEFITS = [
  { title: "Digital Ownership", desc: "Users may hold tokens in compatible wallets and manage their own digital assets.", icon: Wallet },
  { title: "Ecosystem Utility", desc: "Holders may use MERQ for supported services and utilities as they become available.", icon: Zap },
  { title: "Community Participation", desc: "The ecosystem may offer structured participation and reward programs with published eligibility rules.", icon: Users },
  { title: "Allocation Transparency", desc: "The published allocation provides a defined view of how the stated supply is assigned across project purposes.", icon: Eye },
  { title: "Ecosystem Development", desc: "The token model is intended to support product development, liquidity planning, partnerships and community engagement.", icon: Rocket },
];

/* ─── Tokenomics ─── */
const ALLOCATIONS = [
  { name: "Community & Ecosystem Rewards", pct: 25, tokens: "2,500,000", desc: "Allocated to support community engagement, eligible participation programs, ecosystem incentives and reward initiatives.", color: "#fbbf24", icon: Users },
  { name: "Liquidity", pct: 20, tokens: "2,000,000", desc: "Reserved to support token liquidity and facilitate trading accessibility through supported liquidity mechanisms and platforms.", color: "#38bdf8", icon: BarChart3 },
  { name: "Ecosystem Development", pct: 15, tokens: "1,500,000", desc: "Dedicated to product development, technical infrastructure, platform improvements and future ecosystem expansion.", color: "#34d399", icon: Code2 },
  { name: "Treasury", pct: 15, tokens: "1,500,000", desc: "Reserved for strategic financial management, operational requirements and long-term ecosystem sustainability.", color: "#a78bfa", icon: PiggyBank },
  { name: "Team & Founders", pct: 10, tokens: "1,000,000", desc: "Allocated to the core team and founders. 12-month cliff followed by a 24–36 month vesting period.", color: "#f472b6", icon: Building2 },
  { name: "Marketing & Partnerships", pct: 10, tokens: "1,000,000", desc: "Allocated for brand awareness, marketing campaigns, strategic partnerships and ecosystem expansion.", color: "#fb923c", icon: Handshake },
  { name: "Strategic Reserve", pct: 5, tokens: "500,000", desc: "Reserved for future strategic requirements, unforeseen opportunities and long-term ecosystem initiatives.", color: "#94a3b8", icon: Gem },
];

/* ─── Roadmap ─── */
const ROADMAP = [
  { phase: "1", title: "Foundation", desc: "Token infrastructure, smart contract verification, wallet compatibility and transparent token documentation.", icon: Box },
  { phase: "2", title: "Utility Development", desc: "Introduce practical token use cases and integrate MERQ into eligible ecosystem services.", icon: Zap },
  { phase: "3", title: "Ecosystem Expansion", desc: "Expand community participation, partnerships and supported digital services.", icon: Globe },
  { phase: "4", title: "Broader Adoption", desc: "Explore additional integrations, market accessibility and wider ecosystem participation.", icon: Rocket },
];

/* ─── Technical Details ─── */
const TECH_DETAILS = [
  { label: "Token Name", value: "MERQ Token" },
  { label: "Token Symbol", value: "MERQ" },
  { label: "Total Supply", value: "10,000,000 MERQ" },
  { label: "Blockchain Network", value: "To be confirmed" },
  { label: "Token Standard", value: "To be confirmed" },
  { label: "Smart Contract", value: "To be published" },
  { label: "Contract Audit", value: "To be confirmed" },
  { label: "Exchange Availability", value: "To be confirmed" },
];

/* ═══════════════════════════════════════════ */

function SectionTitle({ icon: Icon, children, sub }) {
  return (
    <div className="mb-7 pt-8 first:pt-0">
      <div className="flex items-center gap-3 mb-1.5">
        {Icon && <div className="h-10 w-10 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0"><Icon className="h-5 w-5 text-amber-400" /></div>}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-white">{children}</h2>
      </div>
      {sub && <p className="text-slate-500 text-sm ml-[52px]">{sub}</p>}
    </div>
  );
}

/* ─── Donut Chart (pure CSS/SVG) ─── */
function TokenDonut() {
  const total = ALLOCATIONS.reduce((s, a) => s + a.pct, 0);
  let cumulative = 0;
  const segments = ALLOCATIONS.map((a) => {
    const start = (cumulative / total) * 360;
    cumulative += a.pct;
    const end = (cumulative / total) * 360;
    return { ...a, start, end };
  });

  const r = 80, cx = 100, cy = 100, stroke = 28;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 200" className="w-56 h-56 sm:w-64 sm:h-64">
        {segments.map((seg, i) => {
          const dash = (seg.pct / 100) * circumference;
          const gap = circumference - dash;
          const o = offset;
          offset += dash;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-o} transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-700" style={{ opacity: 0.85 }} />
          );
        })}
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-white font-display text-lg font-extrabold">10M</text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-400 text-[8px] font-mono-merq">MERQ SUPPLY</text>
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-4">
        {ALLOCATIONS.map((a) => (
          <div key={a.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
            <span className="text-[11px] text-slate-400 truncate">{a.name}</span>
            <span className="font-mono-merq text-[11px] text-white ml-auto">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TokenInsights() {
  return (
    <div data-testid="ecosystem-token-insights" className="max-w-5xl mx-auto">
      <PageHeader title="Token Insights" eyebrow="Ecosystem" subtitle="MERQ Token — Introduction, Utility & Tokenomics" />

      {/* ─── HERO ─── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/8 mb-10">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/50" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center p-8 sm:p-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 mb-5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-300">Powering a Decentralized Digital Economy</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              MERQ <span className="text-amber-400">Token</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6 max-w-md">
              A digital asset vision focused on utility, ecosystem development and community participation.
            </p>
            <div className="flex items-center gap-4">
              <div className="glass rounded-2xl border border-amber-400/20 px-6 py-4 text-center">
                <div className="font-display text-3xl font-extrabold text-amber-400">10M</div>
                <div className="font-mono-merq text-[9px] uppercase tracking-widest text-slate-500 mt-1">Total Supply</div>
              </div>
              <div className="glass rounded-2xl border border-white/10 px-6 py-4 text-center">
                <div className="font-display text-3xl font-extrabold text-white">7</div>
                <div className="font-mono-merq text-[9px] uppercase tracking-widest text-slate-500 mt-1">Allocation Categories</div>
              </div>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <img src={HERO_IMG} alt="MERQ Token" className="w-72 h-72 object-cover rounded-full border-4 border-amber-400/20 shadow-[0_0_60px_rgba(251,191,36,0.15)]" />
          </div>
        </div>
      </div>

      {/* ─── OVERVIEW ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={FileText} sub="Understanding the digital asset associated with the MERQ ecosystem.">What is MERQ Token?</SectionTitle>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          MERQ Token is the digital asset associated with the MERQ ecosystem. It is intended to serve as a digital utility and participation asset within the ecosystem. The vision behind MERQ Token is to create a digital economy where blockchain technology, digital transactions, community participation and ecosystem development can work together.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            "Build a blockchain-based digital asset ecosystem.",
            "Encourage community participation and engagement.",
            "Support ecosystem growth, products and development.",
            "Enable digital asset utility and transactions where supported.",
            "Develop long-term value through real ecosystem adoption.",
          ].map((v, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <CheckCircle2 className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 text-xs leading-relaxed">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Code2} sub="A blockchain is a distributed digital ledger that records transactions.">How Does MERQ Token Work?</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW.map((h) => (
            <div key={h.step} className="group rounded-xl border border-white/8 bg-white/[0.02] p-5 hover:border-amber-400/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-400/10 flex items-center justify-center font-display font-extrabold text-amber-400 text-sm">{h.step}</div>
                <h.icon className="h-5 w-5 text-slate-500" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{h.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── UTILITY ─── */}
      <div className="glass rounded-2xl border border-amber-400/10 p-6 sm:p-8 mb-8 bg-gradient-to-br from-amber-400/5 to-transparent">
        <SectionTitle icon={Zap} sub="A proposed framework for how MERQ Token may be integrated into the ecosystem.">Token Utility & Use Cases</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {UTILITY.map((u) => (
            <div key={u.area} className="rounded-xl border border-white/8 bg-black/20 p-5 hover:border-amber-400/15 transition-colors">
              <u.icon className="h-5 w-5 text-amber-400 mb-3" />
              <h3 className="text-white font-semibold text-sm mb-1">{u.area}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── HOLDER BENEFITS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Gem} sub="Potential benefits depend on the features that are actually launched.">Holder Benefits</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-amber-400/15 transition-colors">
              <b.icon className="h-5 w-5 text-amber-400 mb-3" />
              <h3 className="text-white font-semibold text-sm mb-1">{b.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/70 leading-relaxed">Holding MERQ does not automatically create a right to profit, dividends, fixed returns, governance rights or guaranteed access to services.</p>
        </div>
      </div>

      {/* ─── TOKENOMICS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={BarChart3} sub="The stated total supply of MERQ Token is 10 million tokens.">Tokenomics</SectionTitle>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Donut Chart */}
          <TokenDonut />
          {/* Allocation Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-white/10">
                <th className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-400 pb-3 pr-3">Category</th>
                <th className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 pb-3 pr-3 text-right">Share</th>
                <th className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 pb-3 text-right">Tokens</th>
              </tr></thead>
              <tbody>{ALLOCATIONS.map((a) => (
                <tr key={a.name} className="border-b border-white/5 last:border-0">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
                      <span className="text-sm text-white font-medium">{a.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-right font-mono-merq text-sm text-amber-300">{a.pct}%</td>
                  <td className="py-3 text-right font-mono-merq text-sm text-slate-300">{a.tokens}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-amber-400/20">
                <td className="py-3 pr-3 text-sm text-white font-bold">Total</td>
                <td className="py-3 pr-3 text-right font-mono-merq text-sm text-amber-400 font-bold">100%</td>
                <td className="py-3 text-right font-mono-merq text-sm text-white font-bold">10,000,000</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── ALLOCATION BREAKDOWN ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Layers} sub="How each allocation supports the MERQ ecosystem.">Allocation Breakdown</SectionTitle>
        <div className="space-y-3">
          {ALLOCATIONS.map((a) => (
            <div key={a.name} className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: `${a.color}15` }}>
                    <a.icon className="h-4 w-4" style={{ color: a.color }} />
                  </div>
                  <h3 className="text-white font-semibold text-sm">{a.name}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono-merq text-lg font-bold" style={{ color: a.color }}>{a.pct}%</span>
                  <span className="font-mono-merq text-xs text-slate-500">{a.tokens} MERQ</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${a.pct}%`, background: a.color, opacity: 0.7 }} />
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ROADMAP ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Rocket} sub="The long-term direction of MERQ Token.">Future Roadmap</SectionTitle>
        <div className="relative">
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-amber-400/40 via-amber-400/20 to-transparent" />
          <div className="space-y-6">
            {ROADMAP.map((r) => (
              <div key={r.phase} className="relative flex items-start gap-5 pl-1">
                <div className="relative z-10 flex-shrink-0 h-12 w-12 rounded-full bg-slate-900 border-2 border-amber-400/40 flex items-center justify-center">
                  <r.icon className="h-5 w-5 text-amber-400" />
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-merq text-[10px] text-amber-400">Phase {r.phase}</span>
                    <span className="text-white font-semibold text-sm">{r.title}</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TECHNICAL DETAILS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Shield} sub="Clear technical documentation helps users understand how a token is issued, transferred, stored and used.">Technical Details</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {TECH_DETAILS.map((t) => (
            <div key={t.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="font-mono-merq text-[9px] uppercase tracking-widest text-amber-400 mb-1">{t.label}</div>
              <div className="text-white text-sm font-semibold">{t.value}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-5">
          <h4 className="text-rose-300 font-semibold text-sm mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Important Risk Considerations</h4>
          <ul className="space-y-2">
            {[
              "Digital asset prices can fluctuate significantly, and users may lose some or all of the value they assign to their tokens.",
              "Token allocation does not guarantee token value, liquidity or future demand.",
              "Future utility depends on actual product development, adoption and implementation.",
              "Exchange availability, market depth and liquidity are not guaranteed.",
              "Smart contract vulnerabilities, network outages, wallet compromise and user error may result in loss.",
              "No guaranteed profit, fixed return or investment appreciation is promised.",
            ].map((r, i) => (
              <li key={i} className="flex items-start gap-2"><CircleDot className="h-3 w-3 text-rose-400/60 mt-1 flex-shrink-0" /><span className="text-slate-400 text-xs leading-relaxed">{r}</span></li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── CONCLUSION ─── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/8 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 via-transparent to-amber-400/5" />
        <div className="relative p-8 sm:p-12 text-center">
          <Coins className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-3">A Digital Asset. An Expanding Ecosystem.</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto mb-4">
            MERQ Token represents the digital asset vision of the MERQ ecosystem. With a structured allocation model, an emphasis on community participation and a focus on practical utility, the project aims to establish a foundation for future ecosystem development.
          </p>
          <div className="font-display text-lg font-bold text-amber-400">Powering a Decentralized Digital Economy</div>
          <p className="text-slate-500 text-xs mt-6 italic max-w-lg mx-auto">
            This document is an informational project overview. It is not financial, investment, legal or tax advice, and it is not an offer or solicitation to buy or sell any digital asset.
          </p>
        </div>
      </div>
    </div>
  );
}
