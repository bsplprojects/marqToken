import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CheckCircle2, XCircle, Loader2, Users } from "lucide-react";

export const extractAddress = (text) => (text || "").match(/0x[a-fA-F0-9]{40}/)?.[0] || null;

export const SponsorField = ({ value, onChange, onValid, self }) => {
  const [status, setStatus] = useState("idle");
  const addr = extractAddress(value);

  useEffect(() => {
    onValid(null);
    if (!value) return setStatus("idle");
    if (!addr) return setStatus("invalid");
    if (self && addr.toLowerCase() === self.toLowerCase()) return setStatus("self");
    setStatus("checking");
    let live = true;
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/lookup/${addr}`);
        if (!live) return;
        setStatus(data.registered ? "ok" : "unregistered");
        if (data.registered) onValid(data.address);
      } catch { if (live) setStatus("invalid"); }
    }, 350);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, self]);

  const msg = {
    invalid: ["No valid wallet address found", "text-rose-400", XCircle],
    self: ["You can't sponsor yourself", "text-rose-400", XCircle],
    unregistered: ["This wallet is not a registered member", "text-rose-400", XCircle],
    checking: ["Checking sponsor…", "text-slate-400", Loader2],
    ok: [`Sponsor verified · ${addr?.slice(0, 6)}…${addr?.slice(-4)}`, "text-emerald-400", CheckCircle2],
  }[status];
  const Icon = msg?.[2];

  return (
    <div className="mb-5">
      <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
        <Users className="h-3.5 w-3.5" /> Sponsor wallet or referral link
      </label>
      <input
        data-testid="sponsor-input"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="0x… or https://merqonai.io/register?ref=0x…"
        className="w-full rounded-xl border border-white/10 bg-white/5 focus:border-amber-400/50 outline-none px-4 py-3 font-mono-merq text-sm text-amber-200 placeholder:text-slate-600 transition-colors"
      />
      {msg && (
        <div data-testid="sponsor-status" className={`flex items-center gap-1.5 mt-2 text-xs ${msg[1]}`}>
          <Icon className={`h-3.5 w-3.5 ${status === "checking" ? "animate-spin" : ""}`} /> {msg[0]}
        </div>
      )}
    </div>
  );
};
