import { useAdminData, AHeader, Panel, Table, Pill, KCard, Empty, fmt, dt } from "../ui";

export default function Growth() {
  const { data } = useAdminData("adm-growth", "/growth");
  return (
    <div>
      <AHeader title="Profit Growth" subtitle="Protocol growth positions and distribution. Rule versions preserve historical calculations." />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <KCard label="Active Positions" value={data?.active_positions ?? 0} accent="amber" />
        <KCard label="Total Eligible" value={fmt(data?.total_eligible, 0)} accent="cyan" />
        <KCard label="Generated" value={fmt(data?.growth_generated, 0)} accent="emerald" />
        <KCard label="Distributed" value={fmt(data?.growth_distributed, 0)} accent="violet" />
        <KCard label="Pending" value={fmt(data?.pending_growth, 2)} accent="rose" />
      </div>
      <Panel title="Positions">
        {data?.positions?.length ? (
          <Table columns={[{ label: "Member" }, { label: "Amount", right: true }, { label: "Daily %" }, { label: "Term" }, { label: "Status" }, { label: "Claimed", right: true }, { label: "Start" }]}>
            {data.positions.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 font-mono-merq text-slate-300">{p.member}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-white">{fmt(p.amount)}</td>
                <td className="px-5 py-2.5 font-mono-merq text-slate-400">{p.daily_pct}%</td>
                <td className="px-5 py-2.5 text-slate-400">{p.term_days}d</td>
                <td className="px-5 py-2.5"><Pill status={p.status} /></td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-emerald-400">{fmt(p.claimed, 2)}</td>
                <td className="px-5 py-2.5 text-slate-500 text-xs">{dt(p.start)}</td>
              </tr>
            ))}
          </Table>
        ) : <Empty />}
      </Panel>
    </div>
  );
}
