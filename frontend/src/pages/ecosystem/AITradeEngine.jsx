import { PageHeader } from "@/components/PageHeader";
import {
  Activity, Brain, BarChart3, Shield, Zap, Clock, LineChart, Target,
  AlertTriangle, Rocket, CheckCircle2, ArrowRight, Eye, Settings,
  Server, TrendingUp, Gauge, MonitorSmartphone, FileText, Workflow,
  CircleDot, ChevronRight, Radio, Database, Lock, RefreshCw, Users,
  Crosshair, Layers, Globe, Code2, BarChart2,
} from "lucide-react";

const HERO_IMG = "/images/ai-trade-hero.jpg";

/* ─── Core Tech ─── */
const CORE_TECH = [
  { title: "Artificial Intelligence", desc: "May assist with analysing patterns and evaluating selected market data, depending on the models deployed.", icon: Brain },
  { title: "Algorithmic Strategies", desc: "Translate defined market conditions and trading rules into repeatable strategy logic.", icon: Code2 },
  { title: "Market Data Analysis", desc: "Processes supported market information such as prices, volume and selected indicators.", icon: BarChart3 },
  { title: "Automated Execution", desc: "Can route orders through supported broker or exchange integrations when enabled.", icon: Zap },
  { title: "Risk Management", desc: "Applies configured controls such as position limits, stop-loss rules and exposure limits.", icon: Shield },
  { title: "Performance Monitoring", desc: "Records trading activity and provides data for strategy review.", icon: Eye },
];

/* ─── Workflow ─── */
const WORKFLOW = [
  { step: "01", title: "Market Data Collection", desc: "Prices, volume and other available market information from supported data sources.", icon: Database, color: "emerald" },
  { step: "02", title: "AI & Algorithm Analysis", desc: "Configured strategies and analytical models assess market conditions.", icon: Brain, color: "amber" },
  { step: "03", title: "Trading Signal Generation", desc: "Potential trading opportunities are identified against defined rules.", icon: Radio, color: "cyan" },
  { step: "04", title: "Risk Management", desc: "Predefined limits and controls are checked before an order is placed.", icon: Shield, color: "rose" },
  { step: "05", title: "Trade Execution & Reporting", desc: "Orders are routed through supported integrations; activity is recorded.", icon: Activity, color: "violet" },
];

/* ─── Key Benefits ─── */
const BENEFITS = [
  { num: "01", title: "Continuous Market Monitoring", desc: "Software can monitor supported markets and data feeds without requiring a person to watch a screen continuously.", icon: MonitorSmartphone },
  { num: "02", title: "Faster Rule-Based Execution", desc: "When configured conditions are met, an algorithm can submit an eligible order quickly through an available integration.", icon: Zap },
  { num: "03", title: "Reduced Emotional Interference", desc: "A rules-based process can reduce decisions driven by fear, greed or impulsive reactions.", icon: Brain },
  { num: "04", title: "Strategy Consistency", desc: "The same strategy rules can be applied repeatedly, making behaviour more systematic.", icon: RefreshCw },
  { num: "05", title: "Defined Risk Controls", desc: "Position sizing, stop-loss settings and exposure limits can be built into the trading workflow.", icon: Shield },
  { num: "06", title: "Performance Records", desc: "Trade logs and performance reports can help users and operators evaluate strategy behaviour.", icon: FileText },
];

/* ─── Differentiation ─── */
const DIFFERENTIATORS = [
  { capability: "AI-Assisted Analysis", advantage: "Structured review of supported market data and configured signals." },
  { capability: "Automated Execution", advantage: "Reduced reliance on manual order placement where integrations permit." },
  { capability: "Configurable Risk Controls", advantage: "Application of predefined limits before and during trading." },
  { capability: "Strategy Automation", advantage: "Repeatable execution of defined trading rules." },
  { capability: "Performance Dashboard", advantage: "Visibility into trading activity and recorded results." },
  { capability: "Market Monitoring", advantage: "Ongoing monitoring of supported markets and data feeds." },
];

/* ─── User Benefits ─── */
const USER_BENEFITS = [
  { title: "Less Manual Monitoring", desc: "Automated monitoring may reduce the time spent watching market screens.", icon: Clock },
  { title: "More Consistent Execution", desc: "A configured strategy can apply the same entry and exit rules repeatedly.", icon: Target },
  { title: "Systematic Strategy Use", desc: "Users may access trading workflows based on defined strategies rather than ad hoc decisions.", icon: Workflow },
  { title: "Risk-Aware Process", desc: "Available controls may help users set limits for position size, losses and exposure.", icon: Shield },
  { title: "Activity Visibility", desc: "Trade history and performance information can help users review what the system has done.", icon: Eye },
  { title: "Operational Convenience", desc: "Automation may reduce repetitive tasks when the required integrations are available.", icon: Settings },
];

/* ─── Roadmap ─── */
const ROADMAP = [
  { phase: "1", title: "Core Trading Infrastructure", desc: "Establish reliable data connections, strategy execution foundations, account integrations and operational monitoring.", icon: Server },
  { phase: "2", title: "AI-Assisted Market Analysis", desc: "Develop and validate analytical models that support market assessment and signal evaluation.", icon: Brain },
  { phase: "3", title: "Advanced Strategy & Risk Tools", desc: "Expand strategy options, configuration tools, risk controls and performance reporting.", icon: Gauge },
  { phase: "4", title: "Broader Market Integrations", desc: "Explore additional supported markets, broker or exchange integrations and ecosystem connectivity.", icon: Globe },
];

/* ─── Risk Items ─── */
const RISKS = [
  "Trading can result in losses, including the loss of all capital allocated to a strategy.",
  "Past performance, backtests and simulated results do not guarantee future results.",
  "AI models and algorithms can make incorrect assessments or behave unexpectedly in changing market conditions.",
  "Market gaps, volatility, slippage, liquidity constraints and execution delays can affect results.",
  "Technical outages, data errors, connectivity failures and broker or exchange interruptions may disrupt trading.",
  "Stop-loss orders and other risk controls may not execute at the expected price in all market conditions.",
  "Users should protect account credentials and API keys and grant only the permissions necessary for the service.",
];

/* ─── Confirm Items ─── */
const CONFIRM_ITEMS = [
  { item: "Trading Mode", status: "To be confirmed" },
  { item: "Supported Markets & Instruments", status: "To be confirmed" },
  { item: "Broker / Exchange Integrations", status: "To be confirmed" },
  { item: "User Fund Custody & Permissions", status: "To be confirmed" },
  { item: "Risk Controls & User Overrides", status: "To be confirmed" },
  { item: "Performance Methodology", status: "To be documented" },
  { item: "Security Testing & Audits", status: "To be confirmed" },
];

/* ═══════════════════════════════════════════ */

function SectionTitle({ icon: Icon, children, sub }) {
  return (
    <div className="mb-7 pt-8 first:pt-0">
      <div className="flex items-center gap-3 mb-1.5">
        {Icon && <div className="h-10 w-10 rounded-xl bg-emerald-400/10 flex items-center justify-center flex-shrink-0"><Icon className="h-5 w-5 text-emerald-400" /></div>}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-white">{children}</h2>
      </div>
      {sub && <p className="text-slate-500 text-sm ml-[52px]">{sub}</p>}
    </div>
  );
}

const WC = { emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-400",
  rose: "border-rose-400/30 bg-rose-400/10 text-rose-400",
  violet: "border-violet-400/30 bg-violet-400/10 text-violet-400" };

export default function AITradeEngine() {
  return (
    <div data-testid="ecosystem-ai-trade-engine" className="max-w-5xl mx-auto">
      <PageHeader title="AI Trade Engine (Algo)" eyebrow="Ecosystem" subtitle="Artificial Intelligence Meets Algorithmic Trading" />

      {/* ─── HERO ─── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/8 mb-10">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/60" />
        <div className="relative p-8 sm:p-12 lg:p-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 mb-6">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono-merq text-[10px] uppercase tracking-widest text-emerald-300">Intelligent Trading Technology</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4 max-w-2xl">
            Smarter Systems.<br /><span className="text-emerald-400">More Disciplined Execution.</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mb-8">
            A technology-driven approach to market analysis, strategy automation and disciplined trade execution. AI Analysis. Algorithmic Strategies. Risk Controls.
          </p>
          <div className="flex flex-wrap gap-3">
            {["AI Analysis", "Algorithmic Strategies", "Risk Controls"].map((t) => (
              <span key={t} className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-xs text-emerald-300 font-semibold">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── WHAT IS ALGO TRADING ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={BarChart2} sub="A method of executing trading decisions through computer programs.">What Is Algo Trading?</SectionTitle>
        <p className="text-slate-400 text-sm leading-relaxed mb-5">
          Algorithmic Trading (Algo Trading) is a method of executing trading decisions through computer programs that follow predefined rules, mathematical models or strategy conditions. An algorithm can analyse selected market information — such as price, volume, timing and technical indicators — and identify conditions that match a programmed strategy.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            "Rule-based decision-making using predefined trading conditions.",
            "Automated or semi-automated monitoring of selected markets.",
            "Consistent application of a strategy without discretionary changes.",
            "Order execution through a supported broker or exchange connection.",
            "Recording and review of signals, orders and strategy performance.",
          ].map((c, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 text-xs leading-relaxed">{c}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 flex items-start gap-3">
          <Crosshair className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-200/70"><strong>In Simple Terms:</strong> Algo Trading uses software to follow a trading strategy. It can help apply rules consistently and execute eligible trades efficiently, while profits and losses remain uncertain.</p>
        </div>
      </div>

      {/* ─── PRODUCT CONCEPT ─── */}
      <div className="glass rounded-2xl border border-emerald-400/10 p-6 sm:p-8 mb-8 bg-gradient-to-br from-emerald-400/5 to-transparent">
        <SectionTitle icon={Layers} sub="Combining AI, market-data analysis and algorithmic strategies.">What Is the MERQ AI Trade Engine?</SectionTitle>
        <p className="text-slate-400 text-sm leading-relaxed mb-5">
          The MERQ AI Trade Engine is a proposed technology platform that combines artificial intelligence, market-data analysis and algorithmic trading strategies to support or automate parts of the trading workflow. The intended objective is to make trading workflows more structured and technology-driven.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CORE_TECH.map((t) => (
            <div key={t.title} className="rounded-xl border border-white/8 bg-black/20 p-5 hover:border-emerald-400/15 transition-colors">
              <t.icon className="h-5 w-5 text-emerald-400 mb-3" />
              <h3 className="text-white font-semibold text-sm mb-1">{t.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── WORKFLOW ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Workflow} sub="A proposed end-to-end workflow from data to execution.">How Does It Work?</SectionTitle>
        <div className="space-y-4">
          {WORKFLOW.map((w, i) => (
            <div key={w.step} className="group flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-emerald-400/15 transition-colors">
              <div className={`flex-shrink-0 h-14 w-14 rounded-xl border flex items-center justify-center ${WC[w.color]}`}>
                <w.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono-merq text-[10px] text-emerald-400">{w.step}</span>
                  <h3 className="text-white font-semibold text-sm">{w.title}</h3>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{w.desc}</p>
              </div>
              {i < WORKFLOW.length - 1 && <ArrowRight className="h-4 w-4 text-white/10 self-center flex-shrink-0 hidden lg:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* ─── ALGO BENEFITS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={TrendingUp} sub="Operational advantages over fully manual trading workflows.">Key Benefits of Algorithmic Trading</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.num} className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-emerald-400/15 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className="h-8 w-8 rounded-lg bg-emerald-400/10 flex items-center justify-center font-display font-extrabold text-emerald-400 text-xs">{b.num}</span>
                <b.icon className="h-4 w-4 text-slate-500" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{b.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-600 mt-4 italic">These are potential operational benefits, not a promise that an algorithm will outperform manual trading or produce positive returns.</p>
      </div>

      {/* ─── DIFFERENTIATORS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Target} sub="AI-assisted analysis, configurable strategies and disciplined controls.">Why the MERQ AI Trade Engine?</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b border-white/10">
              <th className="font-mono-merq text-[10px] uppercase tracking-widest text-emerald-400 pb-3 pr-4">Proposed Capability</th>
              <th className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 pb-3">Intended Advantage</th>
            </tr></thead>
            <tbody>{DIFFERENTIATORS.map((d, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="text-sm text-white font-semibold py-3 pr-4 whitespace-nowrap">{d.capability}</td>
                <td className="text-xs text-slate-400 py-3 leading-relaxed">{d.advantage}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5 text-center">
          <h4 className="text-white font-display font-bold text-sm mb-1">MERQ Product Vision</h4>
          <p className="text-slate-400 text-xs leading-relaxed max-w-lg mx-auto">
            To develop an intelligent trading infrastructure that combines advanced algorithms, AI-assisted market analysis and disciplined risk management in one connected platform.
          </p>
        </div>
      </div>

      {/* ─── USER BENEFITS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Users} sub="Benefits depend on the product's actual operating mode and integrations.">User Benefits</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USER_BENEFITS.map((b) => (
            <div key={b.title} className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-emerald-400/15 transition-colors">
              <b.icon className="h-5 w-5 text-emerald-400 mb-3" />
              <h3 className="text-white font-semibold text-sm mb-1">{b.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/70 leading-relaxed">Users can still experience losses, including rapid or substantial losses. Automation does not make trading safe or risk-free, and users should understand the strategy and controls before enabling it.</p>
        </div>
      </div>

      {/* ─── ROADMAP ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Rocket} sub="Potential areas of development, not confirmed delivery dates.">Future Roadmap</SectionTitle>
        <div className="relative">
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-emerald-400/40 via-emerald-400/20 to-transparent" />
          <div className="space-y-6">
            {ROADMAP.map((r) => (
              <div key={r.phase} className="relative flex items-start gap-5 pl-1">
                <div className="relative z-10 flex-shrink-0 h-12 w-12 rounded-full bg-slate-900 border-2 border-emerald-400/40 flex items-center justify-center">
                  <r.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-merq text-[10px] text-emerald-400">Phase {r.phase}</span>
                    <span className="text-white font-semibold text-sm">{r.title}</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RISK & TRANSPARENCY ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Shield} sub="Users should understand these risks before using any automated trading system.">Risk & Transparency</SectionTitle>
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-5 mb-6">
          <h4 className="text-rose-300 font-semibold text-sm mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Important Risk Considerations</h4>
          <ul className="space-y-2">
            {RISKS.map((r, i) => (
              <li key={i} className="flex items-start gap-2"><CircleDot className="h-3 w-3 text-rose-400/60 mt-1 flex-shrink-0" /><span className="text-slate-400 text-xs leading-relaxed">{r}</span></li>
            ))}
          </ul>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b border-white/10">
              <th className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-400 pb-3 pr-4">Item to Confirm</th>
              <th className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 pb-3">Status</th>
            </tr></thead>
            <tbody>{CONFIRM_ITEMS.map((c, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="text-sm text-white py-2.5 pr-4">{c.item}</td>
                <td className="py-2.5"><span className="rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 font-mono-merq text-[9px] text-amber-300 uppercase tracking-widest">{c.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* ─── CONCLUSION ─── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/8 mb-8">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-transparent to-emerald-400/5" />
        <div className="relative p-8 sm:p-12 text-center">
          <Activity className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-3">Intelligence Meets Algorithmic Trading</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto mb-4">
            To build a smarter, more systematic and technology-driven trading ecosystem through artificial intelligence, algorithmic innovation and disciplined risk management.
          </p>
          <div className="font-display text-lg font-bold text-emerald-400">Smarter Systems. More Disciplined Execution.</div>
          <p className="text-slate-500 text-xs mt-6 italic max-w-lg mx-auto">
            This document is an informational overview. It is not financial, investment, legal or tax advice, and it is not an offer or solicitation to buy or sell any financial instrument or digital asset. No profit, return, trading accuracy or investment outcome is guaranteed.
          </p>
        </div>
      </div>
    </div>
  );
}
