export default function StatCard({ label, value, sub, icon: Icon, accent = "amber", testid, className = "" }) {
  const accents = {
    amber: "text-amber-400 bg-amber-400/10",
    emerald: "text-emerald-400 bg-emerald-400/10",
    cyan: "text-cyan-400 bg-cyan-400/10",
    violet: "text-violet-400 bg-violet-400/10",
    rose: "text-rose-400 bg-rose-400/10",
    slate: "text-slate-300 bg-white/5",
  };
  return (
    <div
      data-testid={testid}
      className={`glass card-hover rounded-2xl p-5 border border-white/8 ${className}`}
    >
      <div className="flex items-start justify-between">
        <span className="font-mono-merq text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
        {Icon && (
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${accents[accent]}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="font-mono-merq text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-3">
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
