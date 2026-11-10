import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  FileText, Coins, Globe, Users, Rocket, Shield, BarChart3, Lock,
  CheckCircle2, AlertTriangle, Eye, Zap, Target, Layers, Code2,
  TrendingUp, ChevronRight, CircleDot, BookOpen, Clipboard, Check,
  PiggyBank, Handshake, Gem, Building2, Send, Box, Server, Scale,
  ClipboardList, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const HERO_IMG = "/images/whitepaper-hero.jpg";
const CONTRACT = "0x0Be2F6736e8f9188a774Aa953888DeDb883986e6";

/* ─── TOC ─── */
const TOC = [
  { id: "exec", num: "01", label: "Executive Summary" },
  { id: "overview", num: "02", label: "Project Overview" },
  { id: "tech", num: "03", label: "Technology & Operating Model" },
  { id: "utility", num: "04", label: "Token Utility & Use Cases" },
  { id: "benefits", num: "05", label: "Holder Benefits" },
  { id: "tokenomics", num: "06", label: "Tokenomics & Supply" },
  { id: "allocation", num: "07", label: "Allocation Purpose & Vesting" },
  { id: "roadmap", num: "08", label: "Development Roadmap" },
  { id: "disclosure", num: "09", label: "Technical Disclosure" },
  { id: "risks", num: "10", label: "Security & Risks" },
  { id: "legal", num: "11", label: "Legal Disclaimer" },
];

/* ─── Utility Table ─── */
const UTILITY_TABLE = [
  { area: "Ecosystem Payments", purpose: "Payment for services or digital products that officially support MERQ.", status: "To be confirmed" },
  { area: "Platform Access", purpose: "Access to eligible platform features or services under published rules.", status: "To be confirmed" },
  { area: "Community Rewards", purpose: "Incentives for qualifying community activities under transparent program terms.", status: "To be confirmed" },
  { area: "Ecosystem Participation", purpose: "Participation in supported programs and initiatives where applicable.", status: "To be confirmed" },
  { area: "Digital Transactions", purpose: "Transfers between compatible wallets and supported applications.", status: "Network dependent" },
  { area: "Future Integrations", purpose: "Additional integrations as products, partnerships and technical capabilities develop.", status: "Planned" },
];

/* ─── Allocations ─── */
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

/* ─── Tech Specs ─── */
const TECH_SPECS = [
  { label: "Token Name", value: "MERQ Token" },
  { label: "Token Symbol", value: "MERQ" },
  { label: "Total Supply", value: "10,000,000 MERQ" },
  { label: "Smart Contract", value: CONTRACT },
  { label: "Blockchain Network", value: "To be confirmed" },
  { label: "Token Standard", value: "To be confirmed" },
  { label: "Contract Audit", value: "To be confirmed" },
  { label: "Exchange Availability", value: "To be confirmed" },
];

/* ─── Risks ─── */
const RISKS = [
  "Digital asset prices can fluctuate significantly, and users may lose some or all of the value they assign to their tokens.",
  "Token allocation does not guarantee token value, liquidity or future demand.",
  "Future utility depends on actual product development, adoption and implementation.",
  "Exchange availability, market depth and liquidity are not guaranteed.",
  "Smart contract vulnerabilities, network outages, wallet compromise and user error may result in loss.",
  "No guaranteed profit, fixed return or investment appreciation is promised by this document.",
];

/* ─── Donut Chart ─── */
function TokenDonut({ size = "sm" }) {
  const r = 80, cx = 100, cy = 100, stroke = size === "sm" ? 24 : 28;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 200 200" className={size === "sm" ? "w-44 h-44" : "w-56 h-56"}>
      {ALLOCATIONS.map((seg, i) => {
        const dash = (seg.pct / 100) * circ;
        const gap = circ - dash;
        const o = offset;
        offset += dash;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-o} transform={`rotate(-90 ${cx} ${cy})`} style={{ opacity: 0.85 }} />;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-white font-display text-base font-extrabold">10M</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-500 text-[7px] font-mono-merq">MERQ</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════ */

function S({ icon: Icon, children, sub, id }) {
  return (
    <div id={id} className="mb-7 pt-10 first:pt-0 scroll-mt-24">
      <div className="flex items-center gap-3 mb-1.5">
        {Icon && <div className="h-10 w-10 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0"><Icon className="h-5 w-5 text-amber-400" /></div>}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-white">{children}</h2>
      </div>
      {sub && <p className="text-slate-500 text-sm ml-[52px]">{sub}</p>}
    </div>
  );
}

export default function Whitepaper() {
  const [copied, setCopied] = useState(false);
  const copyAddr = () => {
    navigator.clipboard.writeText(CONTRACT);
    setCopied(true);
    toast.success("Contract address copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div data-testid="ecosystem-whitepaper" className="max-w-5xl mx-auto">
      <PageHeader title="Whitepaper" eyebrow="Ecosystem" subtitle="MERQ AI — Token Introduction, Utility & Tokenomics" />

      {/* ─── HERO ─── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/8 mb-10">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/60" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center p-8 sm:p-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 mb-5">
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-300">Official Whitepaper</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              MERQ AI<br /><span className="text-amber-400">Whitepaper</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6 max-w-md">
              A digital asset vision focused on utility, ecosystem development and community participation. Powering a Decentralized Digital Economy.
            </p>
            <div className="flex items-center gap-4">
              <div className="glass rounded-2xl border border-amber-400/20 px-6 py-4 text-center">
                <div className="font-display text-3xl font-extrabold text-amber-400">10M</div>
                <div className="font-mono-merq text-[9px] uppercase tracking-widest text-slate-500 mt-1">Total Supply</div>
              </div>
              <div className="glass rounded-2xl border border-white/10 px-6 py-4 text-center">
                <div className="font-display text-3xl font-extrabold text-white">7</div>
                <div className="font-mono-merq text-[9px] uppercase tracking-widest text-slate-500 mt-1">Allocations</div>
              </div>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <img src={HERO_IMG} alt="" className="w-64 h-64 object-cover rounded-2xl border-2 border-amber-400/20 shadow-[0_0_60px_rgba(251,191,36,0.12)] rotate-3" />
          </div>
        </div>
      </div>

      {/* ─── CONTRACT ADDRESS ─── */}
      <div className="glass rounded-2xl border border-amber-400/20 p-5 mb-8 bg-gradient-to-r from-amber-400/5 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="h-4 w-4 text-amber-400" />
          <span className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-300">MERQ Token Smart Contract Address</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono-merq text-xs sm:text-sm text-amber-300 truncate select-all">
            {CONTRACT}
          </div>
          <button onClick={copyAddr} data-testid="copy-contract-address"
            className="flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-3 text-sm font-semibold transition-colors flex-shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-2">Address provided by the project representative. Verify on-chain before use.</p>
      </div>

      {/* ─── TABLE OF CONTENTS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5 text-amber-400" />
          <h3 className="font-display text-lg font-bold text-white">Contents</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {TOC.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors group">
              <span className="font-mono-merq text-[10px] text-amber-400 w-5">{t.num}</span>
              <span className="text-slate-300 text-xs group-hover:text-white transition-colors">{t.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ─── 01 EXECUTIVE SUMMARY ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <S icon={FileText} id="exec">01 | Executive Summary</S>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          MERQ Token is described as the digital asset associated with the MERQ ecosystem. It is intended to serve as a digital utility and participation asset connecting digital transactions, community participation and ecosystem development.
        </p>
        <p className="text-slate-400 text-sm leading-relaxed">
          The stated total supply is <strong className="text-white">10,000,000 MERQ</strong>. Seven allocation categories are identified: Community & Ecosystem Rewards, Liquidity, Ecosystem Development, Treasury, Team & Founders, Marketing & Partnerships, and Strategic Reserve.
        </p>
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <p className="text-[11px] text-amber-200/70 leading-relaxed">This document separates stated project information from proposed utilities and technical items requiring confirmation. It does not promise returns, token appreciation, exchange listing or guaranteed access to services.</p>
        </div>
      </div>

      {/* ─── 02 PROJECT OVERVIEW ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <S icon={Target} id="overview">02 | Project Overview</S>
        <p className="text-slate-400 text-sm leading-relaxed mb-5">
          MERQ Token is presented as the digital asset associated with the MERQ ecosystem. The stated vision is to create a digital economy in which blockchain technology, digital transactions, community participation and ecosystem development can work together.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {["Build a blockchain-based digital asset ecosystem.", "Encourage community participation and engagement.", "Support ecosystem growth, products and development.", "Enable digital asset utility and transactions where supported.", "Develop long-term value through real ecosystem adoption."].map((v, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <CheckCircle2 className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 text-xs leading-relaxed">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 03 TECHNOLOGY ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <S icon={Server} id="tech" sub="Indicative user journey for token interaction.">03 | Technology & Operating Model</S>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { step: "01", title: "Digital Wallet", desc: "Users hold and manage MERQ through a compatible wallet.", icon: Lock },
            { step: "02", title: "Blockchain Network", desc: "Transactions are submitted to the supported network and recorded.", icon: Globe },
            { step: "03", title: "Token Transactions", desc: "Users may transfer tokens or use them in integrated services.", icon: Send },
            { step: "04", title: "MERQ Ecosystem", desc: "The token may support eligible utilities and participation programs.", icon: Layers },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-white/8 bg-white/[0.02] p-5 hover:border-amber-400/15 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-8 w-8 rounded-lg bg-amber-400/10 flex items-center justify-center font-display font-extrabold text-amber-400 text-xs">{s.step}</span>
                <s.icon className="h-4 w-4 text-slate-500" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{s.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 04 UTILITY ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <S icon={Zap} id="utility" sub="Proposed utility areas — not confirmation every feature is operational.">04 | Token Utility & Use Cases</S>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b border-white/10">
              <th className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-400 pb-3 pr-3">Utility Area</th>
              <th className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 pb-3 pr-3">Purpose</th>
              <th className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 pb-3">Status</th>
            </tr></thead>
            <tbody>{UTILITY_TABLE.map((u, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="text-sm text-white font-semibold py-3 pr-3 whitespace-nowrap">{u.area}</td>
                <td className="text-xs text-slate-400 py-3 pr-3 leading-relaxed">{u.purpose}</td>
                <td className="py-3"><span className="rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 font-mono-merq text-[9px] text-amber-300 uppercase tracking-widest whitespace-nowrap">{u.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* ─── 05 HOLDER BENEFITS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <S icon={Users} id="benefits" sub="Potential benefits depend on features actually launched.">05 | Holder Benefits & Participation</S>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {[
            { title: "Digital Ownership", desc: "Users may hold tokens in compatible wallets and manage their own digital assets.", icon: Lock },
            { title: "Ecosystem Utility", desc: "Holders may use MERQ for services and utilities that officially support the token.", icon: Zap },
            { title: "Community Participation", desc: "The ecosystem may offer structured participation and reward programs with published eligibility rules.", icon: Users },
            { title: "Allocation Transparency", desc: "The published allocation provides a defined view of how the stated supply is assigned.", icon: Eye },
          ].map((b) => (
            <div key={b.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <b.icon className="h-5 w-5 text-amber-400 mb-2" />
              <h3 className="text-white font-semibold text-sm mb-1">{b.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/70 leading-relaxed">Holding MERQ does not automatically create a right to profit, dividends, fixed returns, governance rights or guaranteed access to services.</p>
        </div>
      </div>

      {/* ─── 06 TOKENOMICS ─── */}
      <div className="glass rounded-2xl border border-amber-400/10 p-6 sm:p-8 mb-8 bg-gradient-to-br from-amber-400/5 to-transparent">
        <S icon={BarChart3} id="tokenomics" sub="10,000,000 MERQ total supply across 7 allocation categories.">06 | Tokenomics & Supply</S>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col items-center">
            <TokenDonut />
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
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-white/10">
                <th className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-400 pb-3 pr-3">Category</th>
                <th className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 pb-3 pr-3 text-right">Share</th>
                <th className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 pb-3 text-right">Tokens</th>
              </tr></thead>
              <tbody>{ALLOCATIONS.map((a) => (
                <tr key={a.name} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 pr-3"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: a.color }} /><span className="text-sm text-white">{a.name}</span></div></td>
                  <td className="py-2.5 pr-3 text-right font-mono-merq text-sm text-amber-300">{a.pct}%</td>
                  <td className="py-2.5 text-right font-mono-merq text-sm text-slate-300">{a.tokens}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-amber-400/20"><td className="py-2.5 text-sm text-white font-bold">Total</td><td className="py-2.5 text-right font-mono-merq text-sm text-amber-400 font-bold">100%</td><td className="py-2.5 text-right font-mono-merq text-sm text-white font-bold">10,000,000</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── 07 ALLOCATION DETAIL ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <S icon={Layers} id="allocation" sub="How each allocation supports the MERQ ecosystem.">07 | Allocation Purpose & Vesting</S>
        <div className="space-y-3">
          {ALLOCATIONS.map((a) => (
            <div key={a.name} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${a.color}15` }}>
                    <a.icon className="h-4 w-4" style={{ color: a.color }} />
                  </div>
                  <h3 className="text-white font-semibold text-sm">{a.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono-merq text-base font-bold" style={{ color: a.color }}>{a.pct}%</span>
                  <span className="font-mono-merq text-xs text-slate-500">{a.tokens} MERQ</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2">
                <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: a.color, opacity: 0.7 }} />
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 08 ROADMAP ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <S icon={Rocket} id="roadmap" sub="Proposed direction without confirmed dates.">08 | Development Roadmap</S>
        <div className="relative">
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-amber-400/40 via-amber-400/20 to-transparent" />
          <div className="space-y-6">
            {ROADMAP.map((r) => (
              <div key={r.phase} className="relative flex items-start gap-5 pl-1">
                <div className="relative z-10 flex-shrink-0 h-12 w-12 rounded-full bg-slate-900 border-2 border-amber-400/40 flex items-center justify-center">
                  <r.icon className="h-5 w-5 text-amber-400" />
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2"><span className="font-mono-merq text-[10px] text-amber-400">Phase {r.phase}</span><span className="text-white font-semibold text-sm">{r.title}</span></div>
                  <p className="text-slate-500 text-xs leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-slate-600 mt-4 italic">No token price increase, return or exchange listing is guaranteed.</p>
      </div>

      {/* ─── 09 TECHNICAL DISCLOSURE ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <S icon={Code2} id="disclosure">09 | Technical Disclosure</S>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TECH_SPECS.map((t) => (
            <div key={t.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="font-mono-merq text-[9px] uppercase tracking-widest text-amber-400 mb-1">{t.label}</div>
              <div className="text-white text-xs font-semibold break-all">{t.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 10 RISKS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <S icon={Shield} id="risks">10 | Security, Risks & User Responsibilities</S>
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-5 mb-5">
          <h4 className="text-rose-300 font-semibold text-sm mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Important Risk Considerations</h4>
          <ul className="space-y-2">
            {RISKS.map((r, i) => (
              <li key={i} className="flex items-start gap-2"><CircleDot className="h-3 w-3 text-rose-400/60 mt-1 flex-shrink-0" /><span className="text-slate-400 text-xs leading-relaxed">{r}</span></li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="text-white font-semibold text-sm mb-2">Wallet Safety</h4>
          <p className="text-slate-400 text-xs leading-relaxed">Users should protect wallet credentials and recovery phrases, verify addresses before transactions, and rely on official project channels for verified contract and network information.</p>
        </div>
      </div>

      {/* ─── 11 LEGAL ─── */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 sm:p-8 mb-8">
        <S icon={Scale} id="legal">11 | Legal & Informational Disclaimer</S>
        <p className="text-slate-400 text-xs leading-relaxed mb-3">
          This whitepaper is an informational project overview. It is not financial, investment, legal or tax advice, and it is not an offer or solicitation to buy or sell any digital asset. Prospective users should independently review official project documentation, technical details, applicable laws and risks before taking any action. Legal treatment of digital assets may vary by jurisdiction and may change over time.
        </p>
        <p className="text-slate-400 text-xs leading-relaxed">
          Nothing in this document guarantees profit, fixed returns, token appreciation, liquidity, exchange listing or future access to products or services. Any rights associated with MERQ must be expressly stated in binding official documentation.
        </p>
      </div>

      {/* ─── CONCLUSION ─── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/8 mb-8">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 via-transparent to-amber-400/5" />
        <div className="relative p-8 sm:p-12 text-center">
          <Coins className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">A Digital Asset. An Expanding Ecosystem.</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto mb-4">A future direction built around utility, transparency and community participation.</p>
          <div className="font-display text-lg font-bold text-amber-400 mb-4">Powering a Decentralized Digital Economy</div>
          <a href="https://MerqONai.io" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-6 py-3 text-sm font-semibold transition-colors">
            <Globe className="h-4 w-4" /> Visit MerqONai.io <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
