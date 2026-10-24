import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { INCOME_GROUPS } from "@/lib/incomes";

const NavGroup = ({ group, onNavigate }) => {
  const { pathname } = useLocation();
  const hasActive = group.items.some((i) => pathname === `/income/${i.slug}`);
  const [open, setOpen] = useState(true);
  const Icon = group.icon;
  return (
    <div>
      <button data-testid={`nav-group-${group.key}`} onClick={() => setOpen(!open)}
        className={`group w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${hasActive ? "text-amber-300" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
        <Icon className={`h-[18px] w-[18px] ${hasActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"}`} />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="ml-6 pl-3 border-l border-white/10 space-y-0.5 py-1">
            {group.items.map((i) => {
              const active = pathname === `/income/${i.slug}`;
              return (
                <Link key={i.slug} to={`/income/${i.slug}`} onClick={onNavigate} data-testid={`nav-income-${i.slug}`}
                  className={`block rounded-lg px-3 py-2 text-[13px] transition-colors ${active ? "bg-amber-400/10 text-amber-300" : "text-slate-500 hover:text-white hover:bg-white/5"}`}>
                  {i.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const IncomeNav = ({ onNavigate }) => (
  <div className="pt-2">
    <div className="px-4 pb-1 font-mono-merq text-[9px] uppercase tracking-[0.2em] text-slate-600">Income</div>
    {INCOME_GROUPS.map((g) => <NavGroup key={g.key} group={g} onNavigate={onNavigate} />)}
  </div>
);
