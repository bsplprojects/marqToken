import { PageHeader } from "@/components/PageHeader";
import {
  CreditCard, ShieldCheck, Globe, Wallet, ArrowRight, Smartphone,
  ShoppingBag, History, Lock, Settings, Coins, Banknote, RefreshCw,
  Users, BarChart3, Zap, CheckCircle2, AlertTriangle, Rocket,
  FileText, DollarSign, TrendingUp, Building2, Scale,
} from "lucide-react";

const CARD_IMG = "/images/merqon-pay-card.jpg";

/* ─── Payment Flow Steps ─── */
const FLOW = [
  { num: "01", title: "Registration", desc: "Create an account and complete identity, eligibility and verification checks required by the programme.", icon: Users },
  { num: "02", title: "Card Issuance", desc: "Following approval and payment of the applicable price, receive access to the card. Virtual and physical formats depend on programme availability.", icon: CreditCard },
  { num: "03", title: "Funding or Wallet Link", desc: "Connect an eligible wallet or add funds to a supported card balance, depending on the approved funding model.", icon: Wallet },
  { num: "04", title: "Payment", desc: "Make a payment online or at a compatible point-of-sale terminal, subject to network acceptance and regional restrictions.", icon: ShoppingBag },
  { num: "05", title: "Conversion & Settlement", desc: "If crypto conversion is enabled, the required amount is converted into fiat and the merchant is paid through the issuer and payment partners.", icon: RefreshCw },
];

/* ─── Core Features ─── */
const FEATURES = [
  { icon: Coins, title: "Crypto-Linked Funding", desc: "Connect an eligible digital-asset wallet or use a supported card balance, depending on the final programme model." },
  { icon: Smartphone, title: "Virtual Card", desc: "A digital card may be provided for eligible online transactions if enabled by the issuer." },
  { icon: CreditCard, title: "Physical Card", desc: "A physical card may be offered in supported markets, subject to production and delivery arrangements." },
  { icon: ShoppingBag, title: "Online & In-Store Payments", desc: "Use the card at merchants that accept the selected network, subject to merchant, country and transaction restrictions." },
  { icon: RefreshCw, title: "Crypto-to-Fiat Conversion", desc: "Conversion may be facilitated by approved partners where the feature is available." },
  { icon: History, title: "Transaction History", desc: "View supported card transactions, payment status and applicable charges through the product interface." },
  { icon: Settings, title: "Card Controls", desc: "Available controls may include card freeze/unfreeze, spending limits and replacement requests." },
  { icon: Globe, title: "Multi-Currency Support", desc: "Supported currencies and conversion options will depend on the issuer and programme partners." },
];

/* ─── Benefits ─── */
const USER_BENEFITS = [
  "A familiar card-based payment experience connected to a supported crypto funding arrangement.",
  "Potential access to online and in-store payments through the selected card network.",
  "A single interface for viewing supported card activity and available card controls.",
  "A possible way to use eligible digital assets for selected payment needs, subject to conversion availability, fees and restrictions.",
];
const ECO_BENEFITS = [
  "Extends the ecosystem into a practical payment use case.",
  "May add utility for users who want to access selected payment services using supported digital assets.",
  "Creates opportunities to work with authorised issuers, payment processors, conversion providers and other service partners.",
  "Provides a potential foundation for future payment-related services, subject to regulatory and commercial approvals.",
];

/* ─── Revenue Model ─── */
const REVENUE = [
  { stream: "Card Issuance / Purchase", desc: "The $49 card price may contribute to programme revenue after issuer, production, processing and delivery costs." },
  { stream: "Transaction-Related Revenue", desc: "A programme revenue share may be available where permitted under issuer and card-network agreements." },
  { stream: "Conversion Fee or Spread", desc: "A disclosed fee or exchange-rate spread may apply when crypto is converted into fiat, if supported." },
  { stream: "ATM / Cash Access", desc: "Fees may apply to cash withdrawals if ATM functionality is enabled." },
  { stream: "Premium Services", desc: "Optional paid tiers or enhanced services may be introduced in a future product version." },
  { stream: "Partner Revenue", desc: "Commercial agreements with eligible service providers may generate revenue where lawful and transparently disclosed." },
];

/* ─── Security & Compliance ─── */
const SECURITY = [
  { icon: Building2, title: "Issuer & Programme Partner", desc: "A qualified bank or licensed card issuer / programme manager will generally be needed to issue and operate the card programme." },
  { icon: ShieldCheck, title: "Card Network Authorisation", desc: "Network branding and acceptance must be approved by the relevant network and issuer." },
  { icon: Users, title: "KYC & AML Controls", desc: "Identity verification, sanctions screening, transaction monitoring and country eligibility controls may be required." },
  { icon: Wallet, title: "Funding & Custody Model", desc: "The product must clearly state whether it uses a linked non-custodial wallet, a custodial account or a prepaid balance." },
  { icon: Lock, title: "Data Protection", desc: "Personal and payment information must be handled in accordance with applicable privacy and information-security requirements." },
  { icon: Scale, title: "Fee Transparency", desc: "Users should be informed of exchange rates, conversion charges, transaction fees, ATM fees, spending limits and other applicable costs." },
];

/* ─── Roadmap ─── */
const ROADMAP = [
  { phase: "01", title: "Programme Design", desc: "Confirm target countries, issuer, network, funding model, supported assets, fiat currencies and fee schedule." },
  { phase: "02", title: "Partner & Compliance Review", desc: "Complete issuer due diligence, legal review, KYC/AML design, risk controls and network approval requirements." },
  { phase: "03", title: "Product Integration", desc: "Develop onboarding, wallet or balance integration, card controls, transaction history, support and reporting." },
  { phase: "04", title: "Pilot Launch", desc: "Test the product in approved markets and monitor payment performance, customer support, fraud and operational issues." },
  { phase: "05", title: "Wider Rollout", desc: "Expand only after required approvals, successful testing and confirmation of country-specific availability." },
];

/* ─── Illustrative Model ─── */
const MODEL_STATS = [
  { label: "Assumed Paying Cardholders", value: "100,000" },
  { label: "Card Price", value: "$49" },
  { label: "Gross Card Sales", value: "$4,900,000" },
];

/* ═══════════════════════════════════════════ */

function SectionTitle({ icon: Icon, children, id }) {
  return (
    <div id={id} className="flex items-center gap-3 mb-6 pt-8 first:pt-0">
      {Icon && (
        <div className="h-10 w-10 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-amber-400" />
        </div>
      )}
      <h2 className="font-display text-xl sm:text-2xl font-bold text-white">{children}</h2>
    </div>
  );
}

export default function MerqonPay() {
  return (
    <div data-testid="ecosystem-merqon-pay" className="max-w-5xl mx-auto">
      <PageHeader title="MerqON Pay" eyebrow="Ecosystem" subtitle="Crypto Card" />

      {/* ─── HERO ─── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/8 mb-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.08),transparent_60%)]" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center p-8 sm:p-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 mb-5">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-300">Proposed Programme</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              MerqON Pay<br />
              <span className="text-amber-400">Crypto Card</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6 max-w-md">
              A proposed crypto-linked card product designed to connect supported digital assets with eligible card payments.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="glass rounded-2xl border border-amber-400/20 px-6 py-4 text-center">
                <div className="font-display text-3xl font-extrabold text-amber-400">$49</div>
                <div className="font-mono-merq text-[9px] uppercase tracking-widest text-slate-500 mt-1">Card Cost (USD)</div>
              </div>
              <div className="text-slate-500 text-xs leading-relaxed max-w-[200px]">
                Proposed one-time card issuance price. Additional charges may apply.
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-4 rounded-3xl bg-amber-400/10 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
              <img src={CARD_IMG} alt="MerqON Pay Crypto Card"
                className="relative w-full max-w-md rounded-2xl shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-700" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── EXECUTIVE SUMMARY ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={FileText}>Executive Summary</SectionTitle>
        <p className="text-slate-400 text-sm leading-relaxed">
          MerqON Pay is a proposed crypto-linked card product intended to make eligible digital-asset balances usable for selected everyday payment experiences. Depending on the final programme structure, users may connect an eligible wallet or load funds into a supported card balance. Where crypto conversion is enabled, the required amount may be converted into fiat currency for merchant settlement through authorised programme partners.
        </p>
        <p className="text-slate-400 text-sm leading-relaxed mt-3">
          The product concept combines a card experience with the MerqON digital-asset ecosystem. Its final features, availability and operating model will depend on the selected issuer, card network, payment partners, supported jurisdictions and applicable regulatory requirements.
        </p>
        <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80 leading-relaxed">
            <strong>Product Status:</strong> Concept / proposed programme. The $49 price is included as the stated proposed card cost. Issuer, network, supported countries, funding model and delivery inclusions remain subject to confirmation.
          </p>
        </div>
      </div>

      {/* ─── PAYMENT FLOW ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={ArrowRight}>How the Payment Flow May Work</SectionTitle>
        <div className="space-y-4">
          {FLOW.map((step) => (
            <div key={step.num} className="group flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-amber-400/20 transition-colors">
              <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-amber-400/10 flex items-center justify-center font-display font-extrabold text-amber-400 text-lg">
                {step.num}
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-600 mt-4 italic">Illustrative flow only. The final sequence may differ according to the issuer, card programme, custody arrangement and supported payment methods.</p>
      </div>

      {/* ─── CORE FEATURES ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Zap}>Core Product Features</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-amber-400/15 transition-all duration-300">
              <f.icon className="h-5 w-5 text-amber-400 mb-3" />
              <h3 className="text-white font-semibold text-sm mb-1.5">{f.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── PRICING ─── */}
      <div className="glass rounded-2xl border border-amber-400/15 p-6 sm:p-8 mb-8 bg-gradient-to-br from-amber-400/5 to-transparent">
        <SectionTitle icon={DollarSign}>Card Pricing & Access</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Card Cost", value: "$49 USD — stated one-time card purchase / issuance price." },
            { label: "Card Format", value: "Virtual and/or physical card, subject to final product configuration." },
            { label: "Shipping & Delivery", value: "It has not yet been confirmed whether physical-card shipping is included in the $49 price." },
            { label: "Additional Charges", value: "Issuer, network, conversion, ATM, foreign-exchange, replacement, subscription or tax charges may apply if specified in the final fee schedule." },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-white/8 bg-black/20 p-4">
              <div className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-400 mb-1.5">{item.label}</div>
              <p className="text-slate-300 text-xs leading-relaxed">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── BENEFITS ─── */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="glass rounded-2xl border border-white/8 p-6">
          <SectionTitle icon={Users}>Benefits for Users</SectionTitle>
          <ul className="space-y-3">
            {USER_BENEFITS.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-400 text-xs leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-2xl border border-white/8 p-6">
          <SectionTitle icon={TrendingUp}>Benefits for the MerqON Ecosystem</SectionTitle>
          <ul className="space-y-3">
            {ECO_BENEFITS.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-400 text-xs leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── REVENUE MODEL ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={BarChart3}>Potential Revenue Model</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-400 pb-3 pr-4">Revenue Stream</th>
                <th className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 pb-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {REVENUE.map((r, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="text-sm text-white font-semibold py-3 pr-4 whitespace-nowrap align-top">{r.stream}</td>
                  <td className="text-xs text-slate-400 py-3 leading-relaxed">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-600 mt-4 italic">These are potential revenue channels, not confirmed earnings. Actual revenue will depend on signed agreements, operating costs, user activity, applicable law and programme terms.</p>
      </div>

      {/* ─── ILLUSTRATIVE MODEL ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={DollarSign}>Illustrative Revenue Model — 100,000 Users</SectionTitle>
        <p className="text-slate-500 text-xs mb-5">This scenario models 100,000 users purchasing one MerqON Pay Crypto Card at the stated price of $49 USD. It is an illustrative gross-revenue calculation, not a forecast or a statement of guaranteed earnings.</p>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {MODEL_STATS.map((s, i) => (
            <div key={i} className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-5 text-center">
              <div className="font-display text-2xl font-extrabold text-white">{s.value}</div>
              <div className="font-mono-merq text-[9px] uppercase tracking-widest text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
          <h4 className="text-white font-semibold text-sm mb-2">Revenue vs. Profit</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Gross card sales are not the same as net revenue or profit. The $4.9 million figure represents the total amount collected if 100,000 customers each pay $49. The portion retained by MerqON can only be calculated after confirming issuer fees, card manufacturing and fulfilment costs, payment processing, taxes, refunds and all other programme expenses.
          </p>
        </div>
      </div>

      {/* ─── SECURITY & COMPLIANCE ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={ShieldCheck}>Security, Compliance & Operating Requirements</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECURITY.map((s, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <s.icon className="h-5 w-5 text-rose-400 mb-2.5" />
              <h3 className="text-white font-semibold text-sm mb-1">{s.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ROADMAP ─── */}
      <div className="glass rounded-2xl border border-white/8 p-6 sm:p-8 mb-8">
        <SectionTitle icon={Rocket}>Proposed Launch Roadmap</SectionTitle>
        <div className="relative">
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-amber-400/40 via-amber-400/20 to-transparent" />
          <div className="space-y-6">
            {ROADMAP.map((r) => (
              <div key={r.phase} className="relative flex items-start gap-5 pl-1">
                <div className="relative z-10 flex-shrink-0 h-12 w-12 rounded-full bg-slate-900 border-2 border-amber-400/40 flex items-center justify-center font-display font-extrabold text-amber-400 text-sm">
                  {r.phase}
                </div>
                <div className="pt-1">
                  <h3 className="text-white font-semibold text-sm mb-1">{r.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── DISCLAIMER ─── */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-slate-300 font-semibold text-sm mb-2">Important Notice</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              This document describes MerqON Pay as a proposed product concept. Card issuance, availability, supported assets, payment acceptance, conversion, fees and features are subject to agreements with authorised issuers and service providers, regulatory approvals and country-specific restrictions. A crypto-linked card may not support every merchant, country, digital asset or transaction type. Digital assets are volatile and may involve loss. This document is for general informational purposes only and does not constitute legal, financial or investment advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
