import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Hexagon, ArrowRight, Rocket, Brain, LineChart, Wallet, Coins, Cpu, ShieldCheck,
  Activity, Gauge, Code2, PenTool, PieChart, MessageSquare, Search, Briefcase,
  TrendingUp, Target, CheckCircle2, Globe, Network, Zap, ChevronRight, ArrowLeftRight,
  BarChart3,
} from "lucide-react";

const LOGO = "https://static.prod-images.emergentagent.com/jobs/0d2f38fb-f374-4f65-82fb-6baa71195ee0/images/b4d5a2f8bc3a3e78e56f4a056c410c8f300672e18ba36cf5663509880cb71b6e.jpeg";
const HERO = "https://static.prod-images.emergentagent.com/jobs/0d2f38fb-f374-4f65-82fb-6baa71195ee0/images/c029c899093bdcd680279ee1281843213d817cada88f1eba548e7c7c0d8d4191.jpeg";

const PILLARS = [
  { icon: Brain, title: "AI Solutions", desc: "Smarter technology for a better future." },
  { icon: LineChart, title: "Algorithmic Trading", desc: "Data-driven strategies for consistent growth." },
  { icon: Wallet, title: "Digital Utility", desc: "Fast, secure and borderless services." },
  { icon: Coins, title: "Tokenomics", desc: "Real value, real utility, real opportunities." },
];

const SEGMENTS = [
  { icon: Cpu, title: "Artificial Intelligence", desc: "AI-powered tools designed to support research, productivity, content creation, and digital services." },
  { icon: LineChart, title: "Algorithmic Trading", desc: "A technology-driven trading framework designed to analyze market data and execute strategies according to predefined rules." },
  { icon: Wallet, title: "Digital Utility", desc: "A developing ecosystem of token-based utilities, digital services, and potential marketplace integrations." },
];

const CAPABILITIES = [
  { icon: MessageSquare, title: "AI Chat", desc: "Assistance with general questions, ideas, and everyday tasks." },
  { icon: Search, title: "AI Research", desc: "Support for information gathering, research, and analysis." },
  { icon: Briefcase, title: "AI for Business", desc: "Tools for business planning, productivity, and problem-solving." },
  { icon: Code2, title: "AI Coding", desc: "Programming assistance, code explanations, and debugging support." },
  { icon: PenTool, title: "AI Content Creation", desc: "Support for writing, content planning, and creative workflows." },
  { icon: PieChart, title: "AI Market Analysis", desc: "Analytical support for understanding market information." },
];

const TRADING = [
  { icon: BarChart3, title: "Market Data Analysis", desc: "Analyzing relevant market information to identify potential trading opportunities." },
  { icon: Gauge, title: "Strategy Engine", desc: "Processing trading signals through predefined rules and analytical models." },
  { icon: ShieldCheck, title: "Risk Management", desc: "Applying risk controls, exposure limits, and position-sizing rules." },
  { icon: ArrowLeftRight, title: "Trade Execution", desc: "Executing eligible orders through supported trading infrastructure." },
  { icon: Activity, title: "Performance Monitoring", desc: "Monitoring trading activity, transaction costs, historical performance, and drawdowns." },
];

const ROADMAP = [
  { n: "01", icon: Brain, title: "AI Services", desc: "Development and expansion of AI tools, productivity features, and subscription-based services." },
  { n: "02", icon: Wallet, title: "Digital Payments", desc: "Exploration of supported payment integrations and digital transaction utilities." },
  { n: "03", icon: Briefcase, title: "Merchant Ecosystem", desc: "Potential merchant services and business integrations." },
  { n: "04", icon: Code2, title: "Developer Infrastructure", desc: "Exploration of APIs, developer tools, and third-party integrations." },
];

const TOKENOMICS = [
  ["Symbol", "MERQ"], ["Network", "BNB Smart Chain"], ["Standard", "BEP-20"],
  ["Decimals", "18"], ["Type", "Utility / Ecosystem"], ["Ownership", "Multisig"],
];

const NAV = [
  { label: "AI", href: "#ai" },
  { label: "Algorithmic Trading", href: "#trading" },
  { label: "Digital Utility", href: "#ecosystem" },
  { label: "Tokenomics", href: "#tokenomics" },
];

export default function MarketingLanding() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("revealed"); });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="merq-bg merq-grain min-h-screen relative z-10 overflow-x-hidden" data-testid="marketing-landing">
      <style>{`
        .reveal{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s ease}
        .reveal.revealed{opacity:1;transform:none}
        .gold-line{background:linear-gradient(90deg,transparent,#F3BA2F,transparent)}
        .gold-border{border:1px solid rgba(243,186,47,.25)}
        .eyebrow{letter-spacing:.3em}
      `}</style>

      {/* NAV */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 h-20">
          <a href="#top" className="flex items-center gap-3">
            <img src={LOGO} alt="MerqON" className="h-12 w-12 rounded-full object-cover ring-1 ring-amber-400/40" />
            <div>
              <div className="font-display text-xl font-black tracking-tight leading-none">
                <span className="text-white">Merq</span><span className="gold-text">ON</span>
              </div>
              <div className="font-mono-merq text-[8px] eyebrow text-amber-400/70 uppercase mt-1">Build to Connect</div>
            </div>
          </a>
          <nav className="hidden lg:flex items-center gap-8">
            {NAV.map((n) => (
              <a key={n.label} href={n.href} className="font-mono-merq text-[11px] uppercase tracking-widest text-slate-400 hover:text-amber-300 transition-colors">{n.label}</a>
            ))}
          </nav>
          <Link to="/app" data-testid="nav-launch-app"
            className="group flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-5 py-2.5 text-sm transition-colors">
            <Rocket className="h-4 w-4" /> Launch App
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center px-5 sm:px-8 pt-16 pb-20">
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 rounded-full gold-border bg-amber-400/5 px-4 py-1.5 mb-6">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-mono-merq text-[11px] uppercase eyebrow text-amber-300">Connected Digital Ecosystem</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl font-black tracking-tight leading-[1.02]">
              <span className="text-white">Building a</span><br />
              <span className="gold-text">Connected</span><br />
              <span className="gold-text">Digital Ecosystem</span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 font-display text-base sm:text-lg text-slate-300">
              {["Intelligence", "Innovation", "Global Utility", "Real Impact"].map((w, i) => (
                <span key={w} className="flex items-center gap-4">
                  {i > 0 && <span className="h-1 w-1 rounded-full bg-amber-400/60" />}{w}
                </span>
              ))}
            </div>
            <p className="text-slate-400 mt-6 max-w-xl leading-relaxed">
              MerqON brings together artificial intelligence, algorithmic trading, and blockchain-based
              digital utilities within one integrated technology ecosystem.
            </p>
            <div className="flex flex-wrap gap-4 mt-9">
              <Link to="/app" data-testid="hero-launch-app"
                className="group flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-7 py-3.5 transition-colors">
                <Rocket className="h-5 w-5" /> Launch App
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a href="#about" className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 hover:border-amber-400/40 text-white font-medium px-7 py-3.5 transition-colors">
                Explore Ecosystem <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            <div className="font-mono-merq text-xs uppercase tracking-widest text-amber-400/80 mt-10">One Ecosystem · Endless Possibilities</div>
          </div>

          <div className="fade-up relative">
            <div className="absolute inset-0 bg-amber-400/10 blur-3xl rounded-full" />
            <div className="relative rounded-3xl overflow-hidden gold-border">
              <img src={HERO} alt="MerqON ecosystem" className="w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 -mt-4 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 reveal">
          {PILLARS.map((p) => (
            <div key={p.title} className="glass card-hover rounded-2xl p-6 gold-border">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 mb-4"><p.icon className="h-5 w-5" /></span>
              <div className="font-display font-bold text-white">{p.title}</div>
              <div className="text-sm text-slate-500 mt-1.5">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT / SEGMENTS */}
      <Section id="about" eyebrow="Introducing MerqON" title={<>One Ecosystem.<br /><span className="gold-text">Multiple Digital Possibilities.</span></>}
        subtitle="MerqON is designed to bring together artificial intelligence, algorithmic trading, and blockchain-based digital utilities within an integrated technology ecosystem.">
        <div id="ai" className="grid lg:grid-cols-3 gap-5">
          {SEGMENTS.map((s, i) => (
            <div key={s.title} className="glass card-hover rounded-2xl p-7 gold-border relative overflow-hidden">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-400/5 blur-2xl" />
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 mb-5"><s.icon className="h-6 w-6" /></span>
              <div className="font-mono-merq text-[10px] text-amber-400/60 mb-1">0{i + 1}</div>
              <div className="font-display text-lg font-bold text-white">{s.title}</div>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl p-6 gold-border mt-5 flex items-start gap-3">
          <Target className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-slate-300"><span className="text-white font-semibold">Our Mission — </span>
            To develop accessible digital solutions that combine technology, automation, and practical utility.</p>
        </div>
      </Section>

      {/* AI PLATFORM */}
      <Section eyebrow="MerqON AI Platform" title={<>Intelligent Tools for <span className="gold-text">Everyday Productivity</span></>}
        subtitle="To make AI-powered capabilities more accessible and useful for individuals, creators, and businesses.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="glass card-hover rounded-2xl p-6 border border-white/8">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400"><c.icon className="h-5 w-5" /></span>
                <div className="font-display font-semibold text-white">{c.title}</div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* TRADING */}
      <Section id="trading" eyebrow="Algorithmic Trading Infrastructure" title={<>Data-Driven Trading. <span className="gold-text">Structured Execution.</span></>}
        subtitle="A structured technology framework focused on automation, measurable performance, and risk awareness.">
        <div className="grid lg:grid-cols-5 sm:grid-cols-2 gap-4">
          {TRADING.map((t, i) => (
            <div key={t.title} className="glass card-hover rounded-2xl p-5 border border-white/8">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 mb-3"><t.icon className="h-5 w-5" /></span>
              <div className="font-display font-semibold text-white text-sm">{t.title}</div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* TOKENOMICS */}
      <Section id="tokenomics" eyebrow="Tokenomics" title={<>The <span className="gold-text">MERQ</span> Utility Token</>}
        subtitle="Real value, real utility, real opportunities — a BEP-20 ecosystem token on BNB Smart Chain.">
        <div className="grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 glass rounded-3xl gold-border p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-400/5 blur-3xl" />
            <img src={LOGO} alt="MERQ" className="relative h-28 w-28 rounded-full object-cover ring-2 ring-amber-400/40 mb-5" />
            <div className="relative font-display text-3xl font-black gold-text">MERQ</div>
            <div className="relative font-mono-merq text-xs uppercase tracking-widest text-slate-500 mt-1">BEP-20 · BNB Smart Chain</div>
          </div>
          <div className="lg:col-span-3 glass rounded-3xl border border-white/8 p-8">
            <div className="grid sm:grid-cols-2 gap-4">
              {TOKENOMICS.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3.5">
                  <span className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{k}</span>
                  <span className="font-mono-merq text-sm font-semibold text-amber-300">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-5 leading-relaxed">
              MERQ powers the MerqON ecosystem — membership, rewards, autopool and digital utilities —
              with transparent, configurable mechanics rather than fixed-return promises.
            </p>
          </div>
        </div>
      </Section>

      {/* ROADMAP */}
      <Section id="roadmap" eyebrow="Future Utility Roadmap" title={<>Expanding the <span className="gold-text">MerqON</span> Ecosystem</>}
        subtitle="Proposed development phases that progressively expand practical utility across the ecosystem.">
        <div className="grid lg:grid-cols-4 gap-4">
          {ROADMAP.map((r) => (
            <div key={r.n} className="glass card-hover rounded-2xl p-6 gold-border relative">
              <div className="flex items-center justify-between mb-4">
                <span className="font-display text-3xl font-black text-amber-400/30">{r.n}</span>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400"><r.icon className="h-5 w-5" /></span>
              </div>
              <div className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-400/70">Phase {r.n}</div>
              <div className="font-display font-bold text-white mt-1">{r.title}</div>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl p-6 gold-border mt-5 flex items-start gap-3">
          <Globe className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-slate-300"><span className="text-white font-semibold">Long-Term Vision — </span>
            To develop an interconnected digital ecosystem that delivers practical utility through technology and innovation.</p>
        </div>
      </Section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="relative glass rounded-3xl gold-border p-10 sm:p-16 text-center overflow-hidden reveal">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-60 w-60 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative">
            <Network className="h-10 w-10 text-amber-400 mx-auto mb-5" />
            <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight">
              <span className="text-white">One Ecosystem. </span><span className="gold-text">Multiple Possibilities.</span>
            </h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">Join the MerqON membership ecosystem and explore intelligence, innovation and real digital utility.</p>
            <Link to="/app" data-testid="cta-launch-app"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-8 py-4 mt-8 transition-colors">
              <Rocket className="h-5 w-5" /> Launch the App <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={LOGO} alt="MerqON" className="h-10 w-10 rounded-full object-cover ring-1 ring-amber-400/40" />
              <div>
                <div className="font-display font-black"><span className="text-white">Merq</span><span className="gold-text">ON</span></div>
                <div className="font-mono-merq text-[8px] eyebrow text-amber-400/60 uppercase">Build to Connect</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 font-mono-merq text-[11px] uppercase tracking-widest text-slate-500">
              {NAV.map((n) => <a key={n.label} href={n.href} className="hover:text-amber-300 transition-colors">{n.label}</a>)}
            </div>
          </div>
          <p className="text-[11px] text-slate-600 mt-8 leading-relaxed max-w-3xl">
            Important note: Feature and roadmap availability depends on the actual development and operational status of the platform.
            Roadmap items represent development objectives, not guaranteed launches, and implementation depends on technical feasibility,
            resources, and applicable regulations. Nothing herein constitutes financial advice.
          </p>
          <div className="text-[11px] text-slate-600 mt-4">© {new Date().getFullYear()} MerqON. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

function Section({ id, eyebrow, title, subtitle, children }) {
  return (
    <section id={id} className="max-w-7xl mx-auto px-5 sm:px-8 py-16 reveal">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="h-px w-10 gold-line" />
          <span className="font-mono-merq text-[11px] uppercase eyebrow text-amber-400/80">{eyebrow}</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white">{title}</h2>
        {subtitle && <p className="text-slate-400 mt-4 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
