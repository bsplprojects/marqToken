import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { getStoredWallet, clearWallet, signMessage } from "@/lib/wallet";
import { toast } from "sonner";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState({ merq_usd: 0, bnb_usd: null });

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/member/profile");
      setMember(data);
      return data;
    } catch {
      setMember(null);
      return null;
    }
  }, []);

  const loadPrice = useCallback(async () => {
    try {
      const { data } = await api.get("/price");
      setPrice(data);
    } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("merqon_jwt");
    (async () => {
      if (token) await loadProfile();
      await loadPrice();
      setLoading(false);
    })();
  }, [loadProfile, loadPrice]);

  // wallet = { mode, address, pk? }
  const signIn = useCallback(async (wallet, ref) => {
    const { data: nonceData } = await api.post("/auth/nonce", { address: wallet.address });
    const signature = await signMessage(wallet, nonceData.message);
    const { data } = await api.post("/auth/verify", {
      address: wallet.address,
      nonce: nonceData.nonce,
      signature,
      ref: ref || null,
    });
    localStorage.setItem("merqon_jwt", data.access_token);
    const profile = await loadProfile();
    await loadPrice();
    return { ...data, profile };
  }, [loadProfile, loadPrice]);

  const logout = useCallback(() => {
    clearWallet();
    setMember(null);
    toast("Disconnected");
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{ member, loading, price, signIn, logout, loadProfile, loadPrice, wallet: getStoredWallet() }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
