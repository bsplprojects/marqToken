import { useAdminData, AHeader, Panel, Table, Empty, fmt } from "../ui";
import { Trophy } from "lucide-react";

export default function Leaderboard() {
  const { data } = useAdminData("adm-leaderboard", "/leaderboard");
  return (
    <div>
      <AHeader title="Leaderboard" subtitle="Top members ranked by total team volume." />
      <Panel>
        {data && data.length ? (
          <Table columns={[{ label: "#" }, { label: "Member" }, { label: "Rank" }, { label: "Direct", right: true },
            { label: "Team", right: true }, { label: "Volume", right: true }]}>
            {data.map((m) => (
              <tr key={m.full} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-3">
                  <span className={`font-mono-merq font-bold ${m.rank <= 3 ? "text-amber-400" : "text-slate-500"}`}>
                    {m.rank <= 3 ? <Trophy className="h-4 w-4 inline" /> : null} {m.rank}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono-merq text-slate-200">{m.address}</td>
                <td className="px-5 py-3 text-slate-300">{m.member_rank}</td>
                <td className="px-5 py-3 text-right font-mono-merq text-slate-300">{m.direct}</td>
                <td className="px-5 py-3 text-right font-mono-merq text-slate-300">{m.team}</td>
                <td className="px-5 py-3 text-right font-mono-merq text-amber-300">{fmt(m.volume, 0)}</td>
              </tr>
            ))}
          </Table>
        ) : <Empty />}
      </Panel>
    </div>
  );
}
