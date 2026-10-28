import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAdminData, AHeader, KCard, Panel, Loading, fmt } from "../ui";
import { INCOME_META } from "@/lib/format";
import { TokenRateCard } from "./TokenRateCard";

export default function Dashboard() {
  const { data, isLoading } = useAdminData("adm-dashboard", "/dashboard", { refetchInterval: 30000 });
  if (isLoading || !data) return <Loading />;
  const k = data.kpis;
  const pie = Object.entries(data.income_distribution).filter(([, v]) => v > 0)
    .map(([key, v]) => ({ name: INCOME_META[key]?.label || key, value: v, color: INCOME_META[key]?.color }));

  const groups = [
    { title: "Members", cards: [
      ["Total Members", k.total_members, "amber"], ["Active", k.active_members, "emerald"],
      ["Inactive", k.inactive_members, "slate"], ["New Today", k.new_today, "cyan"]]},
    { title: "Finance", cards: [
      ["Total Deposits", fmt(k.total_deposits, 0), "emerald"], ["Total Withdrawals", fmt(k.total_withdrawals, 0), "rose"],
      ["Pending Withdrawals", k.pending_withdrawals, "amber"], ["Business Volume", fmt(k.business_volume, 0), "cyan"]]},
    { title: "Income Distributed (MERQ)", cards: [
      ["Referral", fmt(k.referral_distributed, 0), "amber"], ["Growth", fmt(k.growth_distributed, 0), "emerald"],
      ["Commission", fmt(k.commission_distributed, 0), "cyan"], ["Rewards", fmt(k.rewards_distributed, 0), "violet"]]},
    { title: "Autopool", cards: [
      ["Pool Members", k.autopool_members, "rose"], ["Active Positions", k.active_positions, "amber"],
      ["Completed Cycles", k.completed_cycles, "emerald"], ["Business Vol.", fmt(k.business_volume, 0), "slate"]]},
  ];

  return (
    <div>
      <AHeader title="Dashboard" subtitle="Real-time overview of the MerqON ecosystem." testid="admin-dashboard" />
      <TokenRateCard />
      {groups.map((g) => (
        <div key={g.title} className="mb-5">
          <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 mb-2">{g.title}</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {g.cards.map(([l, v, a]) => <KCard key={l} label={l} value={v} accent={a} />)}
          </div>
        </div>
      ))}

      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        <Panel title="Member Growth" className="lg:col-span-2 p-4">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.chart}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F3BA2F" stopOpacity={0.4} /><stop offset="100%" stopColor="#F3BA2F" stopOpacity={0} />
              </linearGradient></defs>
              <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="members" stroke="#F3BA2F" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Income Distribution" className="p-4">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pie} dataKey="value" innerRadius={50} outerRadius={85} paddingAngle={3} stroke="none">
                {pie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Deposit vs Withdrawal Volume" className="p-4 mt-5">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.chart}>
            <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: "#64748B", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            <Bar dataKey="deposits" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="withdrawals" fill="#F43F5E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
