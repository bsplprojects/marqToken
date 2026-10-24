import { BrowserProvider, JsonRpcProvider, Contract } from "ethers";
import { ensureChain } from "@/lib/swap";

const ERC20 = ["function balanceOf(address) view returns (uint256)", "function transfer(address,uint256) returns (bool)"];

export async function merqBalanceWei(quote, address) {
  return new Contract(quote.token_address, ERC20, new JsonRpcProvider(quote.rpc_url)).balanceOf(address);
}

// Sends the quoted MERQ amount to the TechPass receiving wallet; returns tx hash after 1 confirmation
export async function payTechPass(quote, memberAddress, onStep) {
  if (!window.ethereum) throw new Error("No wallet detected. Open this page in MetaMask or Trust Wallet.");
  await ensureChain();
  const signer = await new BrowserProvider(window.ethereum).getSigner();
  const me = await signer.getAddress();
  if (me.toLowerCase() !== memberAddress.toLowerCase()) throw new Error("Switch MetaMask to the wallet you signed in with.");
  onStep("sign");
  const tx = await new Contract(quote.token_address, ERC20, signer).transfer(quote.receive_wallet, BigInt(quote.merq_amount_wei));
  onStep("confirm");
  await tx.wait();
  return tx.hash;
}
