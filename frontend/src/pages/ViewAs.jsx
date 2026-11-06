import { useEffect } from "react";
import { Eye, X } from "lucide-react";
import { viewToken } from "@/lib/api";

// opened by admin "Login as member": /view-as#token=... stores a per-tab, view-only session
export default function ViewAs() {
  useEffect(() => {
    const t = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (t) sessionStorage.setItem("merqon_view_jwt", t);
    window.location.replace("/dashboard");
  }, []);
  return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-slate-400 text-sm">Opening member view…</div>;
}

export const ViewAsBanner = () => {
  if (!viewToken()) return null;
  const exit = () => { sessionStorage.removeItem("merqon_view_jwt"); window.close(); window.location.href = "/"; };
  return (
    <div data-testid="view-as-banner" className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber-400 text-slate-950 px-4 py-2 text-sm font-semibold">
      <Eye className="h-4 w-4" /> Admin view-only mode — you are seeing this member's account and can't make changes
      <button data-testid="view-as-exit" onClick={exit} className="inline-flex items-center gap-1 rounded-full bg-slate-950 text-amber-300 px-3 py-0.5 text-xs"><X className="h-3 w-3" /> Exit</button>
    </div>
  );
};
