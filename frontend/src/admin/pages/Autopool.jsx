import { useAdminData, AHeader, Panel, Table, Pill, KCard, Empty, fmt, dt } from "../ui";

export default function Autopool() {
  const { data } = useAdminData("adm-autopool", "/autopool");
  const s = data?.stats, c = data?.config;
  return (
    <div>
      <AHeader title="Autopool" subtitle="Global forced-matrix pool — positions, cycles and analytics." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KCard label="Total Positions" value={s?.total_positions ?? 0} accent="amber" />
        <KCard label="Active" value={s?.active ?? 0} accent="cyan" />
        <KCard label="Completed Cycles" value={s?.completed ?? 0} accent="emerald" />
        <KCard label="Rewards Distributed" value={fmt(s?.rewards_distributed, 0)} accent="rose" />
      </div>
      <Panel title="Configuration" className="p-5 mb-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <Cfg l="Entry" v={`${fmt(c?.entry, 0)} MERQ`} />
          <Cfg l="Capacity" v={c?.capacity} />
          <Cfg l="Cycle Reward" v={`${fmt(c?.reward, 0)} MERQ`} />
          <Cfg l="Re-entry" v={c?.reentry ? "Enabled" : "Disabled"} />
        </div>
      </Panel>
      <Panel title="Positions">
        {data?.positions?.length ? (
          <Table columns={[{ label: "Slot" }, { label: "Member" }, { label: "Filled" }, { label: "Status" }, { label: "Created" }]}>
            {data.positions.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 font-mono-merq text-amber-300">#{p.slot}</td>
                <td className="px-5 py-2.5 font-mono-merq text-slate-300">{p.member}</td>
                <td className="px-5 py-2.5 font-mono-merq text-slate-400">{p.filled}/{p.capacity}</td>
                <td className="px-5 py-2.5"><Pill status={p.status} /></td>
                <td className="px-5 py-2.5 text-slate-500 text-xs">{dt(p.created_at)}</td>
              </tr>
            ))}
          </Table>
        ) : <Empty />}
      </Panel>
    </div>
  );
}
function Cfg({ l, v }) {
  return <div><div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{l}</div><div className="font-mono-merq text-white mt-1">{v}</div></div>;
}
