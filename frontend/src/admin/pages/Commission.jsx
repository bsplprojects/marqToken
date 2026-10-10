import { useAdminData, AHeader, Panel, Table, Pill, KCard, Empty, fmt, dt } from "../ui";

export default function Commission() {
  const { data } = useAdminData("adm-commission", "/commission");
  return (
    <div>
      <AHeader title="Profit Growth Commission" subtitle="Team-volume based commission: eligible volume × rate × qualification." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KCard label="Total Paid" value={fmt(data?.total, 0)} accent="cyan" />
        <KCard label="Transactions" value={data?.count ?? 0} accent="amber" />
        <KCard label="Rate" value={`${data?.rate ?? 0}%`} accent="emerald" />
        <KCard label="Min Directs" value={data?.min_directs ?? 0} accent="violet" />
      </div>
      <Panel title="Commission Transactions">
        {data?.transactions?.length ? (
          <Table columns={[{ label: "Member" }, { label: "Source" }, { label: "Amount", right: true }, { label: "Status" }, { label: "Date" }]}>
            {data.transactions.map((t, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 font-mono-merq text-slate-300">{t.member}</td>
                <td className="px-5 py-2.5 font-mono-merq text-slate-500">{t.source || "—"}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-emerald-400">+{fmt(t.amount)}</td>
                <td className="px-5 py-2.5"><Pill status={t.status} /></td>
                <td className="px-5 py-2.5 text-slate-500 text-xs">{dt(t.created_at)}</td>
              </tr>
            ))}
          </Table>
        ) : <Empty />}
      </Panel>
    </div>
  );
}
