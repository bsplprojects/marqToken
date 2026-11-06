import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Btn, Table, KCard, fmt } from "../ui";
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
        <KCard testid="income-gm-members" label="Global Momentum members" value={data.gm_members} accent="rose" />
      </div>
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <Panel title="Partner Onboarding" className="p-5">
          <Field testid="rule-po-usd" label="$ per TechPass to the direct sponsor (always the sponsor, even for spillover)" value={f.partner_onboarding_usd} disabled={!canEdit} onChange={(v) => setF({ ...f, partner_onboarding_usd: v })} />
        </Panel>
        <Panel title="Global Momentum (one company-wide tree)" className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field testid="rule-gm-levels" label="Levels paid upward" value={f.gm_levels} disabled={!canEdit} onChange={(v) => setF({ ...f, gm_levels: v })} />
            <Field testid="rule-gm-amount" label="$ per level" value={f.gm_amount_per_level} disabled={!canEdit} onChange={(v) => setF({ ...f, gm_amount_per_level: v })} />
            <Field testid="rule-gm-directs" label="Active directs to enter" value={f.gm_min_directs} disabled={!canEdit} onChange={(v) => setF({ ...f, gm_min_directs: v })} />
            <Field testid="rule-gm-deduct" label="Deduct % per payout" value={f.gm_deduct_pct} disabled={!canEdit} onChange={(v) => setF({ ...f, gm_deduct_pct: v })} />
          </div>
          <p className="text-xs text-slate-500 mt-3">An active member enters the tree once they have this many active directs, filled level by level. Each entry pays the set $ (minus the deduction) to every upline up to the set levels.</p>
        </Panel>
      </div>
      <Panel title="Momentum Booster rules" className="p-5 mb-5">
        <div className="grid grid-cols-2 gap-3 max-w-lg">
          <Field testid="rule-mb-save" label="$ saved from every payout" value={f.mb_save_per_payout} disabled={!canEdit} onChange={(v) => setF({ ...f, mb_save_per_payout: v })} />
          <Field testid="rule-mb-directs" label="Active directs needed (else flushed)" value={f.mb_min_directs} disabled={!canEdit} onChange={(v) => setF({ ...f, mb_min_directs: v })} />
        </div>
        <p className="text-xs text-slate-500 mt-3">Every payout saves this amount for the next board and pays the rest. A member moves to the next board when all 62 spots below them are filled (MB1 → MB8). Members with fewer active directs get nothing; the company keeps it.</p>
      </Panel>
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
    </div>
  );
}
