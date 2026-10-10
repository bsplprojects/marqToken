import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAdminAuth } from "./AdminAuth";
import { shortAddr } from "@/lib/format";
import {
  LayoutDashboard, Users, Network, Trophy, Medal, Landmark, ArrowDownToLine,
  ArrowUpFromLine, TrendingUp, GitMerge, Coins, Gift, Layers, Boxes, Banknote,
  Droplets, SlidersHorizontal, FileBarChart, Scale, Bell, Headphones, UserCog,
  ScrollText, Activity, AlertTriangle, Settings as Cog, LogOut, Hexagon, ShieldCheck, Menu, X,
} from "lucide-react";

const NAV = [
  { group: "Overview", items: [
    { to: "dashboard", label: "Dashboard", icon: LayoutDashboard, mod: "dashboard" },
  ]},
  { group: "Members", items: [
    { to: "members", label: "Members", icon: Users, mod: "members" },
  ]},
  { group: "MLM Network", items: [
    { to: "network", label: "Network Trees", icon: Network, mod: "mlm" },
    { to: "leaderboard", label: "Leaderboard", icon: Trophy, mod: "mlm" },
    { to: "ranks", label: "Rank Management", icon: Medal, mod: "ranks" },
  ]},
  { group: "Finance", items: [
    { to: "deposits", label: "Deposits", icon: ArrowDownToLine, mod: "deposits" },
    { to: "withdrawals", label: "Withdrawals", icon: ArrowUpFromLine, mod: "withdrawals" },
    { to: "income", label: "Income", icon: Landmark, mod: "income" },
    { to: "reconciliation", label: "Reconciliation", icon: Scale, mod: "reconciliation" },
  ]},
  { group: "Earnings Engine", items: [
    { to: "growth", label: "Profit Growth", icon: TrendingUp, mod: "growth" },
    { to: "commission", label: "Commission", icon: GitMerge, mod: "commission" },
    { to: "rewards", label: "Rewards", icon: Gift, mod: "rewards" },
    { to: "autopool", label: "Autopool", icon: Layers, mod: "autopool" },
  ]},
  { group: "Blockchain", items: [
    { to: "token", label: "Token & Chain", icon: Coins, mod: "token" },
    { to: "treasury", label: "Treasury", icon: Banknote, mod: "treasury" },
    { to: "liquidity", label: "Liquidity", icon: Droplets, mod: "liquidity" },
  ]},
  { group: "Control", items: [
    { to: "rules", label: "Business Rules", icon: SlidersHorizontal, mod: "rules" },
    { to: "reports", label: "Reports", icon: FileBarChart, mod: "reports" },
    { to: "notifications", label: "Notifications", icon: Bell, mod: "notifications" },
    { to: "support", label: "Support", icon: Headphones, mod: "support" },
  ]},
  { group: "System", items: [
    { to: "users", label: "Admin Users", icon: UserCog, mod: "admin_users" },
    { to: "audit", label: "Audit Logs", icon: ScrollText, mod: "audit" },
    { to: "health", label: "System Health", icon: Activity, mod: "health" },
    { to: "emergency", label: "Emergency Center", icon: AlertTriangle, mod: "emergency" },
    { to: "settings", label: "Settings", icon: Cog, mod: "settings" },
  ]},
];

export default function AdminLayout({ children }) {
  const { admin, logout, can } = useAdminAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const Inner = () => (
    <div className="flex h-full flex-col">
      <Link to="/admin/dashboard" className="flex items-center gap-3 px-5 py-5">
        <div className="relative">
          <Hexagon className="h-8 w-8 text-amber-400 fill-amber-400/10" strokeWidth={1.4} />
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400 absolute inset-0 m-auto" />
        </div>
        <div>
          <div className="font-display text-lg font-extrabold tracking-tight text-white leading-none">MerqON <span className="text-amber-400">Admin</span></div>
          <div className="font-mono-merq text-[8px] tracking-[0.25em] text-amber-400/60 uppercase mt-1">Governance Console</div>
        </div>
      </Link>

      <nav className="flex-1 px-3 space-y-4 overflow-y-auto pb-6">
        {NAV.map((sec) => {
          const items = sec.items.filter((it) => can(it.mod));
          if (!items.length) return null;
          return (
            <div key={sec.group}>
              <div className="px-3 mb-1 font-mono-merq text-[9px] uppercase tracking-[0.2em] text-slate-600">{sec.group}</div>
              {items.map((it) => {
                const active = location.pathname === `/admin/${it.to}`;
                const Icon = it.icon;
                return (
                  <Link key={it.to} to={`/admin/${it.to}`} data-testid={`admin-nav-${it.to}`} onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                      active ? "bg-amber-400/10 text-amber-300" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    <Icon className={`h-[16px] w-[16px] ${active ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    {it.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button data-testid="admin-logout" onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-400 hover:text-rose-300 hover:bg-rose-500/5 transition-colors">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex relative z-10">
      <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-white/5 bg-slate-950/50 sticky top-0 h-screen">
        <Inner />
      </aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-slate-950 border-r border-white/10">
            <button className="absolute right-3 top-4 text-slate-400" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            <Inner />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-4 px-4 sm:px-6 h-14 border-b border-white/5 glass">
          <button className="lg:hidden text-slate-300" onClick={() => setOpen(true)}><Menu className="h-6 w-6" /></button>
          <div className="hidden sm:flex items-center gap-2 font-mono-merq text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-gold" /> Governance Live
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 font-mono-merq text-[10px] uppercase tracking-widest text-amber-300">
              <ShieldCheck className="h-3 w-3" /> {admin?.role}
            </span>
            <div className="text-right">
              <div className="text-xs text-white font-medium">{admin?.name}</div>
              <div className="font-mono-merq text-[10px] text-slate-500">{shortAddr(admin?.address)}</div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
