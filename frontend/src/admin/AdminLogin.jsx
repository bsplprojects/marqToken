import { useState } from "react";
import { useAdminAuth, connectAdminMetaMask, connectAdminDemo, getAdminWallet } from "./AdminAuth";
import { Btn } from "./ui";
import { ShieldCheck, Hexagon, Wallet, Fingerprint, Loader2, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const { signIn } = useAdminAuth();
  const [wallet, setWallet] = useState(getAdminWallet());
  const [busy, setBusy] = useState(false);

  const connect = async (kind) => {
    setBusy(true);
    try {
      const w = kind === "metamask" ? await connectAdminMetaMask() : connectAdminDemo();
      setWallet(w);
      toast.success("Wallet connected");
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const doSign = async () => {
    setBusy(true);
    try {
      const me = await signIn(wallet);
      toast.success(`Welcome, ${me.name} · ${me.role}`);
    } catch (e) { toast.error(e?.response?.data?.detail || e.message || "Access denied"); } finally { setBusy(false); }
  };

  return (
    <div className="merq-bg merq-grain min-h-screen flex items-center justify-center relative z-10 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="relative">
            <Hexagon className="h-10 w-10 text-amber-400 fill-amber-400/10" strokeWidth={1.4} />
            <ShieldCheck className="h-4 w-4 text-amber-400 absolute inset-0 m-auto" />
          </div>
          <div>
            <div className="font-display text-2xl font-extrabold tracking-tight text-white leading-none">MerqON <span className="gold-text">Admin</span></div>
            <div className="font-mono-merq text-[9px] tracking-[0.3em] text-amber-400/70 uppercase mt-1">Governance Console</div>
          </div>
        </div>

        <div className="glass gold-glow rounded-3xl p-8 border border-amber-400/15">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="h-4 w-4 text-amber-400" />
            <span className="font-mono-merq text-[11px] uppercase tracking-widest text-slate-400">Secure wallet-signature access</span>
          </div>

          {!wallet ? (
            <>
              <Btn testid="admin-connect-metamask" className="w-full" onClick={() => connect("metamask")} disabled={busy}>
                <Wallet className="h-4 w-4" /> MetaMask / Injected <ArrowRight className="h-4 w-4 ml-auto" />
              </Btn>
              <div className="relative my-4">
                <div className="h-px bg-white/10" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2 px-3 bg-slate-950 font-mono-merq text-[10px] uppercase tracking-widest text-slate-600">or</span>
              </div>
              <Btn testid="admin-connect-demo" variant="ghost" className="w-full" onClick={() => connect("demo")} disabled={busy}>
                <ShieldCheck className="h-4 w-4 text-amber-400" /> Demo Super Admin Wallet
              </Btn>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-5">
                <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 mb-1">Connected</div>
                <div className="font-mono-merq text-sm text-amber-300 break-all">{wallet.address}</div>
              </div>
              <Btn testid="admin-sign-button" className="w-full" onClick={doSign} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                {busy ? "Verifying…" : "Sign In to Admin"}
              </Btn>
              <button onClick={() => { localStorage.removeItem("merqon_admin_wallet"); setWallet(null); }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 mt-4 transition-colors">
                Use a different wallet
              </button>
            </>
          )}
        </div>
        <p className="text-center text-xs text-slate-600 mt-6">Role-based access control · Immutable audit logging</p>
      </div>
    </div>
  );
}
