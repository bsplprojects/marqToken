import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { fmt, fmtUSD, shortAddr } from "@/lib/format";
import { INCOME_GROUPS } from "@/lib/incomes";
import { PageHeader } from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { TechPassCard } from "@/components/techpass/TechPassCard";
import { PortsCard } from "@/components/ports/PortsCard";
import { toast } from "sonner";
import {
  TrendingUp, Users, Network, ArrowDownToLine, ArrowUpFromLine, Share2,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { member } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/member/dashboard")).data,
    refetchInterval: 30000,
  });
  const { data: streams } = useQuery({ queryKey: ["income-streams"], queryFn: async () => (await api.get("/income/streams")).data });

  const copyRef = () => {
    const link = `${window.location.origin}/register?ref=${member?.address}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied");
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 glass rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }


  return (
    <div>
      <PageHeader
        eyebrow="Member Terminal"
        title="Dashboard"
        subtitle={`Welcome back, ${shortAddr(member?.address)} · Rank ${data.rank}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* balance hero */}
        <div className="lg:col-span-8 glass rounded-3xl border border-amber-400/15 p-8 relative overflow-hidden fade-up">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-amber-400/5 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="font-mono-merq text-[11px] uppercase tracking-[0.25em] text-slate-500">Total MERQ Balance</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest font-mono-merq ${
                data.status === "active" ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-500/10 text-slate-400"
              }`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> {data.status}
              </span>
            </div>
            <div className="mt-4 flex items-end gap-3" data-testid="merq-balance-display">
              <span className="font-mono-merq text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight gold-text">
                {fmt(data.total_balance, 2)}
              </span>
              <span className="font-mono-merq text-xl text-slate-500 mb-1">MERQ</span>
            </div>
            <div className="font-mono-merq text-slate-400 mt-2" data-testid="fiat-value-display">
              ≈ {fmtUSD(data.fiat_value)} <span className="text-slate-600 text-xs">· @ ${data.merq_price_usd}/MERQ</span>
            </div>
            <div className="font-mono-merq text-xs text-slate-500 mt-1">
              Wallet (available to deposit): <span className="text-amber-300">{fmt(data.wallet_balance)} MERQ</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="rounded-xl border border-white/8 bg-white/5 p-4">
                <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Available</div>
                <div className="font-mono-merq text-lg font-bold text-white mt-1">{fmt(data.available)}</div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/5 p-4">
                <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Staked Principal</div>
                <div className="font-mono-merq text-lg font-bold text-white mt-1">{fmt(data.principal)}</div>
              </div>
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                <div className="font-mono-merq text-[10px] uppercase tracking-widest text-emerald-400/70">Pending Growth</div>
                <div className="font-mono-merq text-lg font-bold text-emerald-300 mt-1">{fmt(data.pending_growth, 4)}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
              <button
                data-testid="dashboard-deposit-button"
                onClick={() => navigate("/wallet?tab=deposit")}
                className="flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-5 py-3 transition-colors"
              >
                <ArrowDownToLine className="h-4 w-4" /> Deposit
              </button>
              <button
                data-testid="dashboard-withdraw-button"
                onClick={() => navigate("/wallet?tab=withdraw")}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:border-amber-400/30 text-white font-medium px-5 py-3 transition-colors"
              >
                <ArrowUpFromLine className="h-4 w-4" /> Withdraw
              </button>
              <button
                data-testid="dashboard-refer-button"
                onClick={copyRef}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400/30 text-white font-medium px-5 py-3 transition-colors"
              >
                <Share2 className="h-4 w-4" /> Copy Referral Link
              </button>
            </div>
          </div>
        </div>

        {/* network overview */}
        <div className="lg:col-span-4 grid grid-cols-1 gap-6">
          <StatCard testid="stat-direct" label="Direct Members" value={data.network.direct_members} icon={Users} accent="amber" />
          <StatCard testid="stat-team" label="Total Team" value={data.network.total_team} icon={Network} accent="cyan" sub={`${data.network.active_members} active`} />
          <StatCard testid="stat-volume" label="Team Volume" value={`${fmt(data.network.team_volume, 0)} MERQ`} icon={TrendingUp} accent="emerald" />
        </div>
      </div>

      <TechPassCard />
      <PortsCard />

      {/* income breakdown */}
      {INCOME_GROUPS.map((g) => (
        <div key={g.key} data-testid={`income-group-${g.key}`}>
          <h2 className="font-display text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2">
            <g.icon className="h-5 w-5 text-amber-400" /> {g.label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {g.items.map((c) => (
              <button key={c.key} onClick={() => navigate(`/income/${c.slug}`)} className="text-left">
                <StatCard testid={`income-card-${c.key}`} label={c.label} value={fmt(streams?.[c.key] ?? 0)} sub="MERQ" icon={c.icon} accent={c.accent} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
