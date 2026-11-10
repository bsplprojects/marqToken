import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Layers, Bot, BarChart3, Activity, Wallet, CreditCard, FileText, Gift } from "lucide-react";

const ECOSYSTEM_ITEMS = [
  { to: "/ecosystem/merqon-ai", label: "MerqON AI", icon: Bot },
  { to: "/ecosystem/token-insights", label: "Token Insights", icon: BarChart3 },
  { to: "/ecosystem/ai-trade-engine", label: "AI Trade Engine (Algo)", icon: Activity },
  { to: "/ecosystem/decentralised-wallet", label: "Decentralised Wallet", icon: Wallet },
  { to: "/ecosystem/merqon-pay", label: "MerqON Pay (Crypto Card)", icon: CreditCard },
  { to: "/ecosystem/whitepaper", label: "Whitepaper", icon: FileText },
  { to: "/ecosystem/refer-earn", label: "Refer & Earn", icon: Gift },
];

export const EcosystemNav = ({ onNavigate }) => {
  const { pathname } = useLocation();
  const hasActive = ECOSYSTEM_ITEMS.some((i) => pathname === i.to);
  const [open, setOpen] = useState(hasActive);

  return (
    <div>
      <button
        data-testid="nav-ecosystem-toggle"
        onClick={() => setOpen(!open)}
        className={`group w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 border ${
          hasActive
            ? "bg-amber-400/10 text-amber-300 border-amber-400/20"
            : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
        }`}
      >
        <Layers className={`h-[18px] w-[18px] ${hasActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"}`} />
        <span className="flex-1 text-left">MerqON Ecosystem</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="ml-6 pl-3 border-l border-white/10 space-y-0.5 py-1">
            {ECOSYSTEM_ITEMS.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  data-testid={`nav-eco-${item.to.split("/").pop()}`}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                    active
                      ? "bg-amber-400/10 text-amber-300"
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? "text-amber-400" : "text-slate-600"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
