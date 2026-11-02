import { useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { MerqCoin } from "@/components/MerqCoin";
import { ensureChain } from "@/lib/swap";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AddMerqToMetaMask = () => {
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (!window.ethereum) return toast.error("MetaMask not found. Open this page in MetaMask or install the extension.");
    setBusy(true);
    try {
      const cfg = await (await fetch(`${API}/swap/config`)).json();
      if (!cfg.merq_token_address) throw new Error("MERQ token is not live yet");
      await ensureChain();
      const ok = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: { type: "ERC20", options: { address: cfg.merq_token_address, symbol: "MERQ", decimals: 18, image: `${window.location.origin}/merq-token-256.png` } },
      });
      if (ok) toast.success("MERQ added to your MetaMask");
    } catch (e) {
      if (e?.code !== 4001) toast.error(e?.message || "Could not add MERQ");
    }
    setBusy(false);
  };
  return (
    <button data-testid="add-merq-metamask" onClick={add} disabled={busy}
      className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-200 transition-colors disabled:opacity-60">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MerqCoin size={20} />}
      Add MERQ to MetaMask <Plus className="h-3.5 w-3.5" />
    </button>
  );
};
