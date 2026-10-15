import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { fmt, fmtDate, shortAddr } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import BrandLogo from "@/components/BrandLogo";
import { toast } from "sonner";
import {
  User, Copy, Hexagon, TrendingUp, Loader2, Sprout, BadgeCheck,
} from "lucide-react";

export default function Profile() {
  const { member } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: async () => (await api.get("/member/profile")).data });
  const { data: positions } = useQuery({ queryKey: ["growth"], queryFn: async () => (await api.get("/growth/positions")).data });

  const refLink = `${window.location.origin}/register?ref=${member?.address}`;
  const copy = (text, msg) => { navigator.clipboard.writeText(text); toast.success(msg); };

  const totalClaimable = (positions || []).reduce((a, p) => a + (p.claimable || 0), 0);

  const claim = async () => {
    setBusy(true);
    try {
      const res = await api.post("/growth/claim");
      toast.success(`Claimed ${fmt(res.data.claimed, 4)} MERQ in growth rewards`);
      qc.invalidateQueries({ queryKey: ["growth"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Nothing to claim yet");
    } finally {
      setBusy(false);
    }
  };

  const fields = [
    { label: "Wallet Address", value: profile?.address, mono: true },
    { label: "Sponsor", value: profile?.sponsor ? shortAddr(profile.sponsor) : "— (Root)", mono: true },
    { label: "Joined", value: fmtDate(profile?.joined_at) },
    { label: "Status", value: profile?.status },
    { label: "Rank", value: profile?.rank },
  ];

  return (
    <div>
      <PageHeader eyebrow="Member" title="My Profile" />

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 glass rounded-2xl border border-white/8 p-6">
          <div className="flex items-center gap-4 mb-6">
            <BrandLogo size={56} className="rounded-2xl" />
            <div>
              <div className="font-display text-lg font-bold text-white flex items-center gap-2">
                {shortAddr(profile?.address)}
                {profile?.is_admin && <BadgeCheck className="h-4 w-4 text-amber-400" />}
              </div>
              <div className="font-mono-merq text-xs text-slate-500 uppercase tracking-widest">{profile?.rank} · {profile?.status}</div>
            </div>
          </div>
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3">
                <span className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{f.label}</span>
                <span className={`text-sm text-slate-200 ${f.mono ? "font-mono-merq" : "capitalize"} truncate`}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {/* referral */}
          <div className="glass rounded-2xl border border-amber-400/15 p-6">
            <div className="font-display font-semibold text-white mb-1">Referral Link</div>
            <p className="text-sm text-slate-500 mb-4">Share this link — new members are placed in your network automatically.</p>
            <div className="flex gap-2">
              <input
                data-testid="referral-link-input"
                readOnly value={refLink}
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 font-mono-merq text-xs text-amber-300 outline-none"
              />
              <button data-testid="copy-referral-link-button" onClick={() => copy(refLink, "Referral link copied")}
                className="rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-4 transition-colors flex items-center gap-2">
                <Copy className="h-4 w-4" /> Copy
              </button>
            </div>
          </div>

          {/* profit growth */}
          <div className="glass rounded-2xl border border-emerald-400/15 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-emerald-400" />
                <span className="font-display font-semibold text-white">Profit Growth Positions</span>
              </div>
              <button
                data-testid="growth-claim-button"
                disabled={busy || totalClaimable <= 0}
                onClick={claim}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 text-sm transition-colors disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                Claim {fmt(totalClaimable, 4)}
              </button>
            </div>
            {positions && positions.length > 0 ? (
              <div className="space-y-3" data-testid="growth-positions">
                {positions.map((p) => (
                  <div key={p.id} className="rounded-xl border border-white/8 bg-white/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono-merq text-sm text-white">{fmt(p.amount, 0)} MERQ</span>
                      <span className="font-mono-merq text-xs text-emerald-400">+{fmt(p.claimable, 4)} claimable</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2">
                      <div className="h-full bg-emerald-400/70" style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="flex justify-between font-mono-merq text-[10px] text-slate-500">
                      <span>{p.daily_pct}%/day · {p.term_days}d term</span>
                      <span className="capitalize">{p.status} · {p.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 py-6 text-center">
                No growth positions yet. Make a deposit to open one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
