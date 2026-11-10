import { PageHeader } from "@/components/PageHeader";
import {
  Bot, Brain, Sparkles, Cpu, MessageSquare, FileText, Image, Code2,
  BarChart3, GraduationCap, Globe, Mic, BookOpen, Briefcase, Users,
  Zap, Clock, TrendingUp, DollarSign, Lightbulb, Search, Languages,
  Shield, Rocket, Target, CheckCircle2, ArrowRight, ChevronRight,
  Layers, Server, Eye, AudioLines, Activity, Building2, ShoppingCart,
  Stethoscope, Factory, CreditCard, Settings,
} from "lucide-react";

const HERO_IMG = "/images/merqon-ai-hero.jpg";
const TECH_IMG = "/images/merqon-ai-tech.jpg";

/* ─── AI Capabilities ─── */
const CAPABILITIES = [
  { cap: "Learning", desc: "Identifies patterns and relationships in data.", icon: Brain },
  { cap: "Understanding", desc: "Processes language, instructions and context.", icon: BookOpen },
  { cap: "Reasoning", desc: "Analyzes information and possible solutions.", icon: Lightbulb },
  { cap: "Generation", desc: "Creates text, images and other digital content.", icon: Sparkles },
  { cap: "Prediction", desc: "Uses patterns to estimate possible outcomes.", icon: TrendingUp },
  { cap: "Automation", desc: "Supports repetitive and rule-based digital tasks.", icon: Settings },
];

/* ─── What AI Can Do ─── */
const APPLICATIONS = [
  { area: "AI Chat & Communication", desc: "Ask questions, receive explanations, translate languages and interact with digital assistants.", icon: MessageSquare, color: "amber" },
  { area: "Content Creation", desc: "Generate articles, blogs, emails, marketing materials, proposals and scripts.", icon: FileText, color: "cyan" },
  { area: "Image Generation", desc: "Create digital artwork, illustrations, creative concepts and marketing visuals.", icon: Image, color: "violet" },
  { area: "Coding & Programming", desc: "Generate code, explain programming concepts, debug errors and assist software development.", icon: Code2, color: "emerald" },
  { area: "Data Analysis", desc: "Analyze datasets, identify trends, summarize information and support decisions.", icon: BarChart3, color: "rose" },
  { area: "Education & Learning", desc: "Explain complex subjects, prepare study materials and support personalized learning.", icon: GraduationCap, color: "sky" },
];

/* ─── Benefits ─── */
const BENEFITS = [
  { title: "Time Efficiency", desc: "Helps complete many information-based tasks faster.", icon: Clock },
  { title: "Higher Productivity", desc: "Supports more efficient workflows and task completion.", icon: Zap },
  { title: "Cost Optimization", desc: "Can reduce selected operational expenses when implemented effectively.", icon: DollarSign },
  { title: "Accessibility", desc: "Makes digital assistance available through convenient interfaces.", icon: Globe },
  { title: "Creativity", desc: "Helps users explore ideas and produce creative drafts.", icon: Sparkles },
  { title: "Better Learning", desc: "Makes complex information easier to explore and understand.", icon: GraduationCap },
  { title: "Data Analysis", desc: "Helps identify patterns and useful insights.", icon: BarChart3 },
  { title: "Scalability", desc: "Can support growing digital service requirements.", icon: TrendingUp },
];

/* ─── User Categories ─── */
const USER_CATS = [
  { cat: "Students", apps: "Study assistance, notes, explanations and exam preparation." },
  { cat: "Teachers", apps: "Lesson planning, educational materials and assessment support." },
  { cat: "Entrepreneurs", apps: "Business ideas, planning and research." },
  { cat: "Business Owners", apps: "Reports, marketing and workflow assistance." },
  { cat: "Freelancers", apps: "Content creation, coding and creative projects." },
  { cat: "Developers", apps: "Programming assistance and debugging." },
  { cat: "Content Creators", apps: "Scripts, captions, concepts and content ideas." },
  { cat: "General Users", apps: "Everyday questions, translations and practical guidance." },
];

/* ─── Core Features ─── */
const CORE_FEATURES = [
  { name: "AI Chat Assistant", desc: "Conversational question-answering and general assistance.", icon: MessageSquare },
  { name: "AI Writing Assistant", desc: "Content, email and document drafting.", icon: FileText },
  { name: "AI Image Generator", desc: "Creative visual and image generation.", icon: Image },
  { name: "AI Code Assistant", desc: "Coding explanations and debugging support.", icon: Code2 },
  { name: "AI Research Assistant", desc: "Information discovery and summarization.", icon: Search },
  { name: "AI Translator", desc: "Multilingual communication assistance.", icon: Languages },
  { name: "PDF Assistant", desc: "Document reading and summarization.", icon: BookOpen },
  { name: "AI Business Assistant", desc: "Business planning and analysis support.", icon: Briefcase },
  { name: "AI Education Assistant", desc: "Learning and educational assistance.", icon: GraduationCap },
  { name: "Voice Interaction", desc: "Speech-based interaction, where supported.", icon: Mic },
];

/* ─── Tech Stack ─── */
const TECH = [
  { name: "Machine Learning", fn: "Identifies patterns and learns from data." },
  { name: "Deep Learning", fn: "Uses layered computational models to process complex data." },
  { name: "Natural Language Processing", fn: "Helps systems process and interpret human language." },
  { name: "Large Language Models", fn: "Processes and generates language-based responses." },
  { name: "Neural Networks", fn: "Uses interconnected computational units to process information." },
  { name: "Generative AI", fn: "Creates new text, images, audio or other content." },
  { name: "Computer Vision", fn: "Processes and interprets visual information." },
  { name: "Speech Recognition", fn: "Converts spoken language into text or commands." },
];

/* ─── How It Works ─── */
const WORKFLOW = [
  { step: "01", title: "User Input", desc: "The user enters a question, instruction or prompt.", icon: Users },
  { step: "02", title: "Request Processing", desc: "The platform interprets and prepares the request.", icon: Cpu },
  { step: "03", title: "AI Model", desc: "The connected AI model processes the request and generates an output.", icon: Brain },
  { step: "04", title: "Response Generation", desc: "The platform prepares the response for presentation.", icon: Sparkles },
  { step: "05", title: "User Experience", desc: "The user receives the answer or requested assistance.", icon: CheckCircle2 },
];

/* ─── Revenue Channels ─── */
const REVENUE = [
  { channel: "Subscription Plans", model: "Monthly and annual memberships", nature: "Recurring" },
  { channel: "API Services", model: "Developer access and usage charges", nature: "Usage-based" },
  { channel: "Enterprise Solutions", model: "Customized AI services", nature: "Contract-based" },
  { channel: "AI Credits", model: "Paid access to additional usage", nature: "Consumption-based" },
  { channel: "Marketplace", model: "Commission on third-party tools", nature: "Commission" },
  { channel: "White-Label Solutions", model: "Licensing platform technology", nature: "Licensing" },
  { channel: "Professional Services", model: "AI consulting and integration", nature: "Service-based" },
];

/* ─── Pricing Plans ─── */
const PLANS = [
  { name: "Starter", price: "$5", period: "/month", messages: "500", features: ["Web Search", "PDF Upload", "Image Generation"], accent: "slate" },
  { name: "Pro", price: "$10", period: "/month", messages: "1,000", features: ["Web Search", "PDF Upload", "Image Generation"], accent: "amber", popular: true },
  { name: "Max", price: "$20", period: "/month", messages: "3,000", features: ["Web Search", "PDF Upload", "Image Generation"], accent: "violet" },
];

/* ─── Growth Phases ─── */
const PHASES = [
  { phase: "01", title: "Core AI Platform", focus: "Establish the initial product.", icon: Layers },
  { phase: "02", title: "Subscription System", focus: "Introduce paid memberships.", icon: CreditCard },
  { phase: "03", title: "Advanced AI Tools", focus: "Expand platform capabilities.", icon: Zap },
  { phase: "04", title: "Developer API", focus: "Reach external developers.", icon: Code2 },
  { phase: "05", title: "Enterprise Solutions", focus: "Serve business and institutional customers.", icon: Building2 },
  { phase: "06", title: "Global Expansion", focus: "Explore international markets.", icon: Globe },
];

/* ─── Future Industries ─── */
const INDUSTRIES = [
  { name: "Healthcare", apps: "Research support, administrative automation and clinical workflow assistance.", icon: Stethoscope },
  { name: "Finance", apps: "Financial analysis, fraud detection and reporting assistance.", icon: DollarSign },
  { name: "Education", apps: "Personalized learning and intelligent educational support.", icon: GraduationCap },
  { name: "Manufacturing", apps: "Production optimization and predictive maintenance.", icon: Factory },
  { name: "E-Commerce", apps: "Customer support and intelligent product recommendations.", icon: ShoppingCart },
  { name: "Smart Technology", apps: "Connected systems and intelligent digital services.", icon: Cpu },
];

/* ─── Principles ─── */
const PRINCIPLES = [
  { title: "Accessibility", desc: "Making AI easier to access and use." },
  { title: "Innovation", desc: "Continuously improving technology and services." },
  { title: "Simplicity", desc: "Delivering user-friendly digital experiences." },
  { title: "Productivity", desc: "Helping users work more efficiently." },
  { title: "Scalability", desc: "Supporting individual and business requirements." },
  { title: "Reliability", desc: "Prioritizing dependable digital services." },
  { title: "Sustainability", desc: "Developing a viable technology business." },
];

/* ═══════════════════════════════════════════ */

function SectionTitle({ icon: Icon, children, sub, light }) {
  return (
    <div className="mb-8 pt-10 first:pt-0">
      <div className="flex items-center gap-3 mb-2">
        {Icon && <div className={`h-10 w-10 rounded-xl ${light ? "bg-white/10" : "bg-amber-400/10"} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${light ? "text-amber-300" : "text-amber-400"}`} />
        </div>}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-white">{children}</h2>
      </div>
      {sub && <p className="text-slate-500 text-sm ml-[52px]">{sub}</p>}
    </div>
  );
}

const C = { amber: "border-amber-400/20 bg-amber-400/5 text-amber-400", cyan: "border-cyan-400/20 bg-cyan-400/5 text-cyan-400",
  violet: "border-violet-400/20 bg-violet-400/5 text-violet-400", emerald: "border-emerald-400/20 bg-emerald-400/5 text-emerald-400",
  rose: "border-rose-400/20 bg-rose-400/5 text-rose-400", sky: "border-sky-400/20 bg-sky-400/5 text-sky-400" };

export default function MerqonAI() {
  return (
    <div data-testid="ecosystem-merqon-ai" className="max-w-5xl mx-auto">
      <PageHeader title="MerqON AI" eyebrow="Ecosystem" subtitle="Artificial Intelligence for Everyone" />

      {/* ─── HERO ─── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/8 mb-10">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/60" />
        <div className="relative p-8 sm:p-12 lg:p-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 mb-6">
            <Bot className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-300">Intelligent Digital Assistance</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4 max-w-2xl">
            Connecting Human Potential<br />with <span className="text-amber-400">Artificial Intelligence</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mb-8">
            MerqON AI is an AI-powered digital assistant platform designed to make artificial intelligence accessible, practical and useful for individuals, professionals, entrepreneurs and organizations.
          </p>
          <div className="flex flex-wrap gap-3">
            {["Think Smarter", "Work Faster", "Create More"].map((t) => (
              <span key={t} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white font-semibold">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── VISION & MISSION ─── */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-amber-400" />
            <h3 className="font-display text-lg font-bold text-white">Our Vision</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">To make artificial intelligence accessible to everyone and build a smarter digital ecosystem that empowers people through technology.</p>
        </div>
        <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-amber-400" />
            <h3 className="font-display text-lg font-bold text-white">Our Mission</h3>
          </div>
          <ul className="space-y-2">
            {["Simplify everyday activities through intelligent technology.", "Make AI tools accessible and easy to use.", "Support education, creativity and professional development.", "Help businesses improve productivity and efficiency.", "Develop innovative AI-powered digital solutions."].map((m, i) => (
              <li key={i} className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" /><span className="text-slate-400 text-xs leading-relaxed">{m}</span></li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── AI CAPABILITIES ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Brain} sub="Understanding the technology shaping modern digital experiences.">Key Capabilities of AI</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CAPABILITIES.map((c) => (
            <div key={c.cap} className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center hover:border-amber-400/20 transition-all">
              <c.icon className="h-6 w-6 text-amber-400 mx-auto mb-2" />
              <div className="text-white font-semibold text-xs mb-1">{c.cap}</div>
              <div className="text-slate-600 text-[10px] leading-snug">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── WHAT AI CAN DO ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Zap} sub="AI can support a broad range of everyday and professional activities.">What Can We Do With AI?</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPLICATIONS.map((a) => (
            <div key={a.area} className={`group rounded-xl border p-5 transition-all hover:scale-[1.01] ${C[a.color]}`} style={{ background: "rgba(0,0,0,0.2)" }}>
              <a.icon className="h-5 w-5 mb-3" />
              <h3 className="text-white font-semibold text-sm mb-1">{a.area}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── BENEFITS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={TrendingUp} sub="AI can improve how people and organizations approach information and work.">Benefits of AI</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-amber-400/15 transition-colors">
              <b.icon className="h-5 w-5 text-amber-400 mb-2" />
              <div className="text-white font-semibold text-xs mb-0.5">{b.title}</div>
              <div className="text-slate-500 text-[10px] leading-relaxed">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── USER CATEGORIES ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Users} sub="AI can act as a digital assistant across different professions and lifestyles.">Who Can Use MerqON AI?</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {USER_CATS.map((u) => (
            <div key={u.cat} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="text-amber-400 font-semibold text-xs mb-1">{u.cat}</div>
              <div className="text-slate-500 text-[10px] leading-relaxed">{u.apps}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CORE FEATURES ─── */}
      <div className="glass rounded-2xl border border-amber-400/10 p-6 sm:p-8 mb-8 bg-gradient-to-br from-amber-400/5 to-transparent">
        <SectionTitle icon={Layers} sub="A proposed integrated AI productivity ecosystem.">MerqON AI Core Features</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {CORE_FEATURES.map((f) => (
            <div key={f.name} className="group rounded-xl border border-white/8 bg-black/20 p-4 hover:border-amber-400/20 transition-all text-center">
              <f.icon className="h-6 w-6 text-amber-400 mx-auto mb-2" />
              <div className="text-white font-semibold text-xs mb-1">{f.name}</div>
              <div className="text-slate-500 text-[10px] leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TECHNOLOGY ─── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/8 mb-8">
        <img src={TECH_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 to-slate-950/95" />
        <div className="relative p-6 sm:p-8">
          <SectionTitle icon={Cpu} light sub="Core technologies that enable modern AI applications.">AI Technology & Intelligence</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TECH.map((t) => (
              <div key={t.name} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                <div className="text-amber-300 font-semibold text-xs mb-1">{t.name}</div>
                <div className="text-slate-400 text-[10px] leading-relaxed">{t.fn}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Activity} sub="From a user's request to an AI-generated response.">How MerqON AI Works</SectionTitle>
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {WORKFLOW.map((w, i) => (
            <div key={w.step} className="flex-1 relative">
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-center h-full">
                <div className="h-10 w-10 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto mb-2">
                  <w.icon className="h-5 w-5 text-amber-400" />
                </div>
                <div className="font-mono-merq text-[10px] text-amber-400 mb-1">{w.step}</div>
                <div className="text-white font-semibold text-xs mb-1">{w.title}</div>
                <div className="text-slate-500 text-[10px] leading-relaxed">{w.desc}</div>
              </div>
              {i < WORKFLOW.length - 1 && <ArrowRight className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/40 z-10" />}
            </div>
          ))}
        </div>
      </div>

      {/* ─── PRICING ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={CreditCard} sub="Published plan prices and message allowances.">Subscription & Pricing</SectionTitle>
        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map((p) => (
            <div key={p.name} className={`relative rounded-2xl border p-6 text-center transition-all hover:scale-[1.02] ${p.popular ? "border-amber-400/30 bg-amber-400/5" : "border-white/8 bg-white/[0.02]"}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 text-slate-950 px-3 py-0.5 font-mono-merq text-[9px] font-bold uppercase tracking-widest">Popular</div>}
              <div className="font-display text-lg font-bold text-white mb-1">{p.name}</div>
              <div className="mb-4">
                <span className="font-display text-3xl font-extrabold text-white">{p.price}</span>
                <span className="text-slate-500 text-sm">{p.period}</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 mb-4">
                <span className="font-mono-merq text-amber-400 text-lg font-bold">{p.messages}</span>
                <span className="text-slate-400 text-xs ml-1">messages / period</span>
              </div>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ─── REVENUE MODEL ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={DollarSign} sub="A diversified digital revenue ecosystem.">Business & Revenue Model</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b border-white/10">
              <th className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-400 pb-3 pr-4">Channel</th>
              <th className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 pb-3 pr-4">Business Model</th>
              <th className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 pb-3">Revenue Nature</th>
            </tr></thead>
            <tbody>{REVENUE.map((r, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="text-sm text-white font-semibold py-3 pr-4 whitespace-nowrap">{r.channel}</td>
                <td className="text-xs text-slate-400 py-3 pr-4">{r.model}</td>
                <td className="py-3"><span className="rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 font-mono-merq text-[9px] text-amber-300 uppercase tracking-widest">{r.nature}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* ─── GROWTH ROADMAP ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Rocket} sub="A phased roadmap for long-term development.">Growth Strategy</SectionTitle>
        <div className="relative">
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-amber-400/40 via-amber-400/20 to-transparent" />
          <div className="space-y-5">
            {PHASES.map((p) => (
              <div key={p.phase} className="relative flex items-start gap-5 pl-1">
                <div className="relative z-10 flex-shrink-0 h-12 w-12 rounded-full bg-slate-900 border-2 border-amber-400/40 flex items-center justify-center">
                  <p.icon className="h-5 w-5 text-amber-400" />
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-merq text-[10px] text-amber-400">Phase {p.phase}</span>
                    <span className="text-white font-semibold text-sm">{p.title}</span>
                  </div>
                  <p className="text-slate-500 text-xs">{p.focus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FUTURE INDUSTRIES ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Globe} sub="AI is creating opportunities across industries.">Future Opportunities</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDUSTRIES.map((ind) => (
            <div key={ind.name} className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-amber-400/15 transition-colors">
              <ind.icon className="h-5 w-5 text-amber-400 mb-3" />
              <h3 className="text-white font-semibold text-sm mb-1">{ind.name}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{ind.apps}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── WHY MERQON AI ─── */}
      <div className="glass rounded-2xl border border-amber-400/10 p-6 sm:p-8 mb-8 bg-gradient-to-br from-amber-400/5 to-transparent">
        <SectionTitle icon={Shield} sub="Our principles and value proposition.">Why MerqON AI?</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-xl border border-white/8 bg-black/20 p-3 text-center">
              <div className="text-amber-400 font-semibold text-[11px] mb-0.5">{p.title}</div>
              <div className="text-slate-500 text-[9px] leading-snug">{p.desc}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-5">
          <h4 className="text-white font-semibold text-sm mb-3">Our Value Proposition</h4>
          <ul className="grid sm:grid-cols-2 gap-2">
            {["One digital platform for multiple AI-powered capabilities.", "An accessible digital assistant experience.", "Tools designed for different user categories.", "Flexible subscription and service models.", "Opportunities for continued product innovation."].map((v, i) => (
              <li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" /><span className="text-slate-400 text-xs leading-relaxed">{v}</span></li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── CONCLUSION ─── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/8 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 via-transparent to-amber-400/5" />
        <div className="relative p-8 sm:p-12 text-center">
          <Bot className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-3">The Future Is Intelligent</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto mb-6">
            Artificial Intelligence is transforming the way people communicate, learn, create and work. MerqON AI aims to contribute to this transformation by building an intelligent digital platform that connects people, ideas and opportunities through modern AI technology.
          </p>
          <div className="font-display text-lg font-bold text-amber-400">Build to Connect.</div>
          <p className="text-slate-500 text-xs mt-6 italic max-w-lg mx-auto">This corporate profile describes proposed platform positioning and illustrative business scenarios. Product features, pricing, technical architecture and financial assumptions should be verified before external publication.</p>
        </div>
      </div>
    </div>
  );
}
