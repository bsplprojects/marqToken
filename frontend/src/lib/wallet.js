import { BrowserProvider } from "ethers";

const STORAGE = "merqon_wallet";

export function getStoredWallet() {
  try {
    const w = JSON.parse(localStorage.getItem(STORAGE));
    return w?.mode === "metamask" ? w : null;
  } catch {
    return null;
  }
}

function storeWallet(w) {
  localStorage.setItem(STORAGE, JSON.stringify(w));
  return w;
}

export function clearWallet() {
  localStorage.removeItem(STORAGE);
  localStorage.removeItem("merqon_jwt");
}

export function hasMetaMask() {
  return typeof window !== "undefined" && !!window.ethereum;
}

// Connect real MetaMask / injected wallet
export async function connectMetaMask() {
  if (!hasMetaMask()) throw new Error("No injected wallet (MetaMask) detected");
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return storeWallet({ mode: "metamask", address });
}

// Sign an arbitrary message with the connected wallet
export async function signMessage(wallet, message) {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer.signMessage(message);
}
