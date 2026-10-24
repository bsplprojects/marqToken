import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Sample allocation — replace with final MERQ tokenomics.
const TOTAL_SUPPLY = 1_000_000_000;
const ALLOCATION = [
  { name: "Community & Rewards", pct: 35, color: "#F3BA2F", note: "Member rewards, autopool & incentives" },
  { name: "Liquidity", pct: 20, color: "#d4a017", note: "DEX liquidity on BNB Smart Chain" },
  { name: "Ecosystem Development", pct: 15, color: "#22d3ee", note: "AI, trading & utility build-out" },
  { name: "Team (vested)", pct: 10, color: "#a78bfa", note: "12-month cliff, 24-month linear vesting" },
  { name: "Treasury", pct: 10, color: "#34d399", note: "Multisig-held strategic reserve" },
  { name: "Marketing & Partnerships", pct: 5, color: "#fb7185", note: "Growth, listings & alliances" },
  { name: "Reserve", pct: 5, color: "#64748b", note: "Contingency & future utility" },
];

export const TokenAllocation = () => (
  <div data-testid="token-allocation" className="glass rounded-3xl gold-border p-6 sm:p-8 mt-5">
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Token allocation</div>
        <div className="font-display text-2xl font-black text-white mt-1">Total Supply <span data-testid="token-total-supply" className="gold-text">{TOTAL_SUPPLY.toLocaleString()} MERQ</span></div>
      </div>
      <span className="font-mono-merq text-[10px] uppercase tracking-widest rounded-full border border-amber-400/25 text-amber-300/80 px-3 py-1">Sample allocation</span>
    </div>
    <div className="grid lg:grid-cols-5 gap-6 items-center">
      <div className="lg:col-span-2 h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={ALLOCATION} dataKey="pct" nameKey="name" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none">
              {ALLOCATION.map((a) => <Cell key={a.name} fill={a.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#0B0F17", border: "1px solid rgba(243,186,47,.25)", borderRadius: 12, fontSize: 12 }}
              formatter={(v, n) => [`${v}% · ${((TOTAL_SUPPLY * v) / 100).toLocaleString()} MERQ`, n]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="font-display text-3xl font-black gold-text">1B</div>
          <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">MERQ</div>
        </div>
      </div>
      <div className="lg:col-span-3 grid sm:grid-cols-2 gap-3">
        {ALLOCATION.map((a, i) => (
          <div key={a.name} data-testid={`token-alloc-${i}`} className="rounded-xl border border-white/8 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-white"><span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />{a.name}</span>
              <span className="font-mono-merq text-sm font-bold text-amber-300">{a.pct}%</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{((TOTAL_SUPPLY * a.pct) / 100).toLocaleString()} MERQ · {a.note}</div>
          </div>
        ))}
      </div>
    </div>
    <p className="text-[11px] text-slate-600 mt-6">Sample allocation for illustration. Final tokenomics will be confirmed before launch.</p>
  </div>
);
