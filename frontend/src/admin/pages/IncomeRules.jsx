import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Btn, Table, KCard, Empty, fmt, dt } from "../ui";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";

const cell = "w-full bg-slate-900 border border-white/10 rounded-md px-2 py-1.5 font-mono-merq text-xs text-white outline-none focus:border-amber-400/40";
const LABEL = { tp_partner_onboarding: "Partner Onboarding", tp_momentum_booster: "Momentum Booster", tp_global_momentum: "Global Momentum" };

const Field = ({ label, value, onChange, disabled, testid }) => (
  <div>
    <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{label}</label>
    <input data-testid={testid} type="number" step="any" disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} className={`${cell} mt-1 text-sm py-2`} />
  </div>
);

export default function IncomeRules() {
  const { can } = useAdminAuth();
  const qc = useQueryClient();
  const { data } = useAdminData("adm-income-rules", "/income-rules");
  const [f, setF] = useState(null);
  const canEdit = can("settings", true);
  useEffect(() => { if (data && !f) setF(JSON.parse(JSON.stringify(data.rules))); }, [data, f]);
  if (!f) return null;

  const setBoard = (i, k, v, li) => {
    const b = [...f.mb_boards];
    b[i] = li === undefined ? { ...b[i], [k]: v } : { ...b[i], levels: b[i].levels.map((x, j) => (j === li ? v : x)) };
    setF({ ...f, mb_boards: b });
  };
  const save = async () => {
    try {
      await adminApi.put("/income-rules", f);
      toast.success("Income rules saved");
      qc.invalidateQueries({ queryKey: ["adm-income-rules"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save"); }
  };

  return (
    <div>
      <AHeader title="TechPass Income Rules" subtitle="Paid when a member's TechPass payment is confirmed. Amounts in USD, credited as MERQ at the live price.">
        {canEdit && <Btn testid="income-rules-reset" variant="ghost" onClick={() => setF(JSON.parse(JSON.stringify(data.defaults)))}><RotateCcw className="h-4 w-4" /> Chart defaults</Btn>}
        {canEdit && <Btn testid="income-rules-save" onClick={save}><Save className="h-4 w-4" /> Save</Btn>}
      </AHeader>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {Object.entries(data.totals).map(([k, v]) => <KCard key={k} testid={`income-total-${k}`} label={LABEL[k]} value={`$${fmt(v.usd)}`} accent="amber" />)}
        <KCard testid="income-lp-treasury" label="To LP & Treasury" value={`$${fmt(data.lp_treasury_usd)}`} accent="cyan" />
        <KCard testid="income-gm-skipped" label="GM skipped (unqualified)" value={`$${fmt(data.gm_skipped.usd)}`} accent="rose" />
      </div>
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <Panel title="Partner Onboarding" className="p-5">
          <Field testid="rule-po-pct" label="% of TechPass price to direct sponsor" value={f.partner_onboarding_pct} disabled={!canEdit} onChange={(v) => setF({ ...f, partner_onboarding_pct: v })} />
        </Panel>
        <Panel title="Global Momentum" className="p-5">
          <div className="grid grid-cols-3 gap-3">
            <Field testid="rule-gm-levels" label="Levels" value={f.gm_levels} disabled={!canEdit} onChange={(v) => setF({ ...f, gm_levels: v })} />
            <Field testid="rule-gm-amount" label="$ per participant" value={f.gm_amount_per_level} disabled={!canEdit} onChange={(v) => setF({ ...f, gm_amount_per_level: v })} />
            <Field testid="rule-gm-directs" label="Min direct TechPass" value={f.gm_min_directs} disabled={!canEdit} onChange={(v) => setF({ ...f, gm_min_directs: v })} />
          </div>
        </Panel>
      </div>
      <Panel title="Momentum Booster Boards (2-wide, 5 levels, built from each sponsor's team)" className="mb-5">
        <Table columns={[{ label: "Board" }, { label: "Members" }, ...[1, 2, 3, 4, 5].map((l) => ({ label: `L${l} $` })), { label: "Net profit $" }, { label: "Save for next $" }]}>
          {f.mb_boards.map((b, i) => (
            <tr key={i} className="border-b border-white/5">
              <td className="px-4 py-2 font-display font-bold text-amber-300">MB{i + 1}</td>
              <td className="px-4 py-2 font-mono-merq text-xs text-slate-400">{data.board_members[`MB${i + 1}`] ?? 0}</td>
              {b.levels.map((x, li) => (
                <td key={li} className="px-2 py-2 min-w-[80px]"><input data-testid={`rule-mb${i + 1}-l${li + 1}`} type="number" disabled={!canEdit} value={x} onChange={(e) => setBoard(i, null, e.target.value, li)} className={cell} /></td>
              ))}
              <td className="px-2 py-2 min-w-[100px]"><input data-testid={`rule-mb${i + 1}-net`} type="number" disabled={!canEdit} value={b.net_profit} onChange={(e) => setBoard(i, "net_profit", e.target.value)} className={cell} /></td>
              <td className="px-2 py-2 min-w-[100px]"><input data-testid={`rule-mb${i + 1}-save`} type="number" disabled={!canEdit} value={b.upgrade_save} onChange={(e) => setBoard(i, "upgrade_save", e.target.value)} className={cell} /></td>
            </tr>
          ))}
        </Table>
        <p className="px-5 py-3 text-xs text-slate-500">Each new entrant pays L1–L5 to their 5 uplines in that board. A member is paid until their net profit is reached, then saves for the next board and enters it automatically; whatever is left of the savings after the next board's level payouts goes to LP & Treasury.</p>
      </Panel>
      <Panel title="Recent TechPass Income">
        {data.recent.length ? (
          <Table columns={[{ label: "Wallet" }, { label: "Income" }, { label: "USD", right: true }, { label: "MERQ", right: true }, { label: "Detail" }, { label: "Date" }]}>
            {data.recent.map((t) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-400">{t.address.slice(0, 8)}…{t.address.slice(-4)}</td>
                <td className="px-5 py-2.5 text-slate-200">{LABEL[t.type]}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-slate-200">${fmt(t.usd ?? 0)}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-amber-300">{fmt(t.merq, 4)}</td>
                <td className="px-5 py-2.5 text-xs text-slate-500">{t.board || (t.level ? `Level ${t.level}` : "—")}</td>
                <td className="px-5 py-2.5 text-xs text-slate-500">{dt(t.created_at)}</td>
              </tr>
            ))}
          </Table>
        ) : <Empty text="No TechPass income yet." />}
      </Panel>
    </div>
  );
}
