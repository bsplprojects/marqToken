import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { shortAddr } from "@/lib/format";
import { toast } from "sonner";
import BrandLogo from "@/components/BrandLogo";
import {
  LayoutDashboard, Network as NetworkIcon, TrendingUp, Layers, Award,
  ReceiptText, Wallet, User, Settings as SettingsIcon, ShieldCheck,
  LogOut, Copy, Menu, X, Hexagon, ArrowLeftRight,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tid: "nav-dashboard" },
  { to: "/network", label: "My Network", icon: NetworkIcon, tid: "nav-network" },
  { to: "/income", label: "Income", icon: TrendingUp, tid: "nav-income" },
  { to: "/autopool", label: "Autopool", icon: Layers, tid: "nav-autopool" },
  { to: "/rewards", label: "Rewards", icon: Award, tid: "nav-rewards" },
  { to: "/transactions", label: "Transactions", icon: ReceiptText, tid: "nav-transactions" },
  { to: "/wallet", label: "Wallet", icon: Wallet, tid: "nav-wallet" },
  { to: "/swap", label: "Swap", icon: ArrowLeftRight, tid: "nav-swap" },
  { to: "/profile", label: "My Profile", icon: User, tid: "nav-profile" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, tid: "nav-settings" },
];

export default function Layout({ children }) {
  const { member, logout, price } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const nav = NAV;

  const copyAddr = () => {
    navigator.clipboard.writeText(member?.address || "");
    toast.success("Address copied");
  };

  const SidebarInner = () => (
    <div className="flex h-full flex-col">
      <Link to="/dashboard" className="flex items-center gap-3 px-6 py-6">
        <BrandLogo size={40} />
        <div>
          <div className="font-display text-xl font-extrabold tracking-tight text-white leading-none">MerqON</div>
          <div className="font-mono-merq text-[10px] tracking-[0.25em] text-amber-400/70 uppercase mt-1">Build for everyone</div>
        </div>
      </Link>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              data-testid={item.tid}
              onClick={() => setOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                active
                  ? "bg-amber-400/10 text-amber-300 border border-amber-400/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${active ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="glass rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">MERQ Price</span>
            <span className="font-mono-merq text-sm text-amber-400">${price?.merq_usd ?? "0.00"}</span>
          </div>
          {price?.bnb_usd && (
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">BNB</span>
              <span className="font-mono-merq text-xs text-slate-400">${price.bnb_usd}</span>
            </div>
          )}
        </div>
        <button
          data-testid="logout-button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/5 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Disconnect
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex relative z-10">
      {/* desktop sidebar */}
      <aside className="hidden lg:flex w-72 flex-shrink-0 border-r border-white/5 bg-slate-950/40 sticky top-0 h-screen">
        <SidebarInner />
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="relative w-72 bg-slate-950 border-r border-white/10">
            <button className="absolute right-3 top-5 text-slate-400" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <SidebarInner />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* topbar */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-8 h-16 border-b border-white/5 glass">
          <button className="lg:hidden text-slate-300" onClick={() => setOpen(true)} data-testid="mobile-menu-button">
            <Menu className="h-6 w-6" />
          </button>
          <div className="hidden sm:flex items-center gap-2 font-mono-merq text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-gold" />
            BNB Smart Chain · Mainnet
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {member?.is_admin && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 font-mono-merq text-[10px] uppercase tracking-widest text-amber-300">
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}
            <button
              data-testid="wallet-address-badge"
              onClick={copyAddr}
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono-merq text-xs text-slate-200 hover:border-amber-400/30 transition-colors"
            >
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              {shortAddr(member?.address)}
              <Copy className="h-3 w-3 text-slate-500 group-hover:text-amber-400" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
