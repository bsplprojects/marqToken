import { Wallet, BrowserProvider } from "ethers";

// Fixed demo admin wallet (Hardhat account #0) — simulated only, no real funds.
export const ADMIN_DEMO_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
export const ADMIN_DEMO_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const STORAGE = "merqon_wallet";

export function getStoredWallet() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE));
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

// Create a fresh in-app demo wallet (full nonce + signature flow, no extension needed)
export function connectDemoMember() {
  const w = Wallet.createRandom();
  return storeWallet({ mode: "demo", address: w.address, pk: w.privateKey });
}

// Connect the fixed demo admin wallet
export function connectDemoAdmin() {
  const w = new Wallet(ADMIN_DEMO_PK);
  return storeWallet({ mode: "demo", address: w.address, pk: ADMIN_DEMO_PK });
}

// Sign an arbitrary message with the active wallet
export async function signMessage(wallet, message) {
  if (wallet.mode === "metamask") {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return signer.signMessage(message);
  }
  const w = new Wallet(wallet.pk);
  return w.signMessage(message);
}
