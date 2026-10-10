import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Wallet, BrowserProvider } from "ethers";
import { adminApi, AUTH_API } from "./adminApi";
import { ADMIN_DEMO_PK } from "@/lib/wallet";

const AdminAuthContext = createContext(null);
const STORE = "merqon_admin_wallet";

function store(w) { localStorage.setItem(STORE, JSON.stringify(w)); return w; }
export function getAdminWallet() { try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; } }

export async function connectAdminMetaMask() {
  if (!window.ethereum) throw new Error("No injected wallet (MetaMask) detected");
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  return store({ mode: "metamask", address: await signer.getAddress() });
}
export function connectAdminDemo() {
  const w = new Wallet(ADMIN_DEMO_PK);
  return store({ mode: "demo", address: w.address, pk: ADMIN_DEMO_PK });
}
async function sign(wallet, message) {
  if (wallet.mode === "metamask") {
    const provider = new BrowserProvider(window.ethereum);
    return (await provider.getSigner()).signMessage(message);
  }
  return new Wallet(wallet.pk).signMessage(message);
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const { data } = await adminApi.get("/me");
      setAdmin(data);
      return data;
    } catch {
      setAdmin(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (localStorage.getItem("merqon_admin_jwt")) await loadMe();
      setLoading(false);
    })();
  }, [loadMe]);

  const signIn = useCallback(async (wallet) => {
    const { data: n } = await axios.post(`${AUTH_API}/auth/nonce`, { address: wallet.address });
    const signature = await sign(wallet, n.message);
    const { data } = await axios.post(`${AUTH_API}/auth/verify`, { address: wallet.address, nonce: n.nonce, signature });
    localStorage.setItem("merqon_admin_jwt", data.access_token);
    const me = await loadMe();
    if (!me) {
      localStorage.removeItem("merqon_admin_jwt");
      throw new Error("This wallet is not an authorized admin.");
    }
    return me;
  }, [loadMe]);

  const logout = useCallback(() => {
    localStorage.removeItem("merqon_admin_jwt");
    localStorage.removeItem(STORE);
    setAdmin(null);
    window.location.href = "/admin";
  }, []);

  const can = useCallback((module, write = false) => {
    if (!admin) return false;
    const lvl = admin.permissions?.[module];
    if (!lvl) return false;
    return write ? lvl === "edit" : true;
  }, [admin]);

  return (
    <AdminAuthContext.Provider value={{ admin, loading, signIn, logout, can }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() { return useContext(AdminAuthContext); }
