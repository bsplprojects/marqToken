import { useQuery } from "@tanstack/react-query";
import { adminApi } from "./adminApi";

export function useAdminData(key, url, options = {}) {
  return useQuery({ queryKey: Array.isArray(key) ? key : [key], queryFn: async () => (await adminApi.get(url)).data, ...options });
}

export function fmt(n, dp = 2) {
  if (n === null || n === undefined || isNaN(n)) return "0";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
export function dt(s) {
  if (!s) return "—";
  try { return new Date(s).toLocaleString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return s; }
}

export function AHeader({ title, subtitle, children, testid }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-7" data-testid={testid}>
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 mt-1.5 text-sm max-w-2xl">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ children, className = "", title, action, testid }) {
  return (
    <div data-testid={testid} className={`glass rounded-2xl border border-white/8 ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white text-sm">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function KCard({ label, value, sub, accent = "amber", testid }) {
  const a = {
    amber: "text-amber-400", emerald: "text-emerald-400", cyan: "text-cyan-400",
    violet: "text-violet-400", rose: "text-rose-400", slate: "text-slate-200",
  }[accent];
  return (
    <div data-testid={testid} className="glass rounded-xl border border-white/8 p-4 card-hover">
      <div className="font-mono-merq text-[9px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`font-mono-merq text-xl sm:text-2xl font-bold mt-2 ${a}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export function Pill({ status }) {
  const map = {
    active: "text-emerald-400 bg-emerald-400/10", completed: "text-emerald-400 bg-emerald-400/10",
    confirmed: "text-emerald-400 bg-emerald-400/10", matched: "text-emerald-400 bg-emerald-400/10",
    resolved: "text-emerald-400 bg-emerald-400/10", online: "text-emerald-400 bg-emerald-400/10",
    pending: "text-amber-400 bg-amber-400/10", under_review: "text-amber-400 bg-amber-400/10",
    in_progress: "text-amber-400 bg-amber-400/10", processing: "text-amber-400 bg-amber-400/10",
    inactive: "text-slate-400 bg-slate-500/10", open: "text-cyan-400 bg-cyan-400/10",
    rejected: "text-rose-400 bg-rose-400/10", failed: "text-rose-400 bg-rose-400/10",
    blocked: "text-rose-400 bg-rose-400/10", suspended: "text-rose-400 bg-rose-400/10",
    critical: "text-rose-400 bg-rose-400/10", offline: "text-rose-400 bg-rose-400/10",
    simulated: "text-cyan-400 bg-cyan-400/10", degraded: "text-amber-400 bg-amber-400/10",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono-merq uppercase tracking-wide ${map[status] || "text-slate-400 bg-slate-500/10"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {String(status || "").replace("_", " ")}
    </span>
  );
}

export function Table({ columns, children, testid }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid={testid}>
        <thead>
          <tr className="text-left font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
            {columns.map((c, i) => (
              <th key={i} className={`px-5 py-3 ${c.right ? "text-right" : ""}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Loading() {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 glass rounded-xl animate-pulse" />)}
    </div>
  );
}

export function Empty({ text = "No records found." }) {
  return <div className="py-12 text-center text-slate-500 text-sm">{text}</div>;
}

export function Btn({ children, onClick, variant = "primary", className = "", testid, disabled, type }) {
  const styles = {
    primary: "bg-amber-400 hover:bg-amber-300 text-slate-950",
    ghost: "border border-white/10 bg-white/5 hover:border-amber-400/30 text-white",
    danger: "bg-rose-500 hover:bg-rose-400 text-white",
    emerald: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
  }[variant];
  return (
    <button type={type} data-testid={testid} disabled={disabled} onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${styles} ${className}`}>
      {children}
    </button>
  );
}
