import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { Gift, Users, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ReferAndEarn() {
  const { member } = useAuth();
  const [copied, setCopied] = useState(false);
  const refLink = member?.address ? `${window.location.origin}/register?ref=${member.address}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div data-testid="ecosystem-refer-earn">
      <PageHeader title="Refer & Earn" eyebrow="Ecosystem" subtitle="Invite friends to MerqON and earn rewards for every active referral." />

      {/* Referral Link Card */}
      <div className="glass rounded-2xl border border-amber-400/20 p-6 mb-6 bg-gradient-to-r from-amber-400/5 to-transparent">
        <div className="flex items-center gap-3 mb-3">
          <Share2 className="h-5 w-5 text-amber-400" />
          <h3 className="text-white font-semibold text-sm">Your Referral Link</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono-merq text-xs text-slate-300 truncate">
            {refLink || "Connect wallet to see your link"}
          </div>
          <button onClick={copyLink} data-testid="copy-referral-link"
            className="flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-3 text-sm font-semibold transition-colors flex-shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: Share2, title: "Share Your Link", desc: "Send your unique referral link to friends, family, or your community." },
          { icon: Users, title: "They Join & Activate", desc: "When they connect their wallet and purchase a TechPass, they're in your network." },
          { icon: Gift, title: "You Earn Rewards", desc: "Receive partner onboarding bonuses, MB payouts, and level commissions." },
        ].map((c, i) => (
          <div key={i} className="group glass rounded-2xl border border-white/8 p-6 hover:border-amber-400/20 transition-all duration-500">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-400/10 text-amber-400 font-display font-bold text-lg mb-4">
              {i + 1}
            </div>
            <h3 className="text-white font-semibold text-base mb-2">{c.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
