import { useAdminData, AHeader, Panel, Table, Empty, dt } from "../ui";

export default function Audit() {
  const { data } = useAdminData("adm-audit", "/audit?limit=300");
  return (
    <div>
      <AHeader title="Audit Logs" subtitle="Immutable record of every sensitive admin action." />
      <Panel>
        {data && data.length ? (
          <Table testid="audit-table" columns={[{ label: "Time" }, { label: "Admin" }, { label: "Role" }, { label: "Action" },
            { label: "Module" }, { label: "Target" }, { label: "IP" }]}>
            {data.map((a) => (
              <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 text-slate-500 text-xs">{dt(a.created_at)}</td>
                <td className="px-5 py-2.5"><div className="text-slate-200 text-sm">{a.admin}</div><div className="font-mono-merq text-[10px] text-slate-500">{a.admin_address}</div></td>
                <td className="px-5 py-2.5 text-amber-300 text-xs">{a.role}</td>
                <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-300">{a.action}</td>
                <td className="px-5 py-2.5 text-slate-400 text-xs capitalize">{a.module}</td>
                <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-500 truncate max-w-[160px]">{a.target || "—"}</td>
                <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-600">{a.ip || "—"}</td>
              </tr>
            ))}
          </Table>
        ) : <Empty text="No audit records yet." />}
      </Panel>
    </div>
  );
}
