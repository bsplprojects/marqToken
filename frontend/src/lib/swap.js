import { BrowserProvider, JsonRpcProvider, Contract, formatUnits, parseUnits, ZeroAddress } from "ethers";

const ERC20 = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
];
const FACTORY = ["function getPair(address,address) view returns (address)"];
const PAIR = ["function getReserves() view returns (uint112,uint112,uint32)", "function token0() view returns (address)"];
const ROUTER = [
  "function getAmountsOut(uint256,address[]) view returns (uint256[])",
  "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint256,address[],address,uint256) payable",
  "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)",
];
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
export const GAS_RESERVE = parseUnits("0.003", 18);

const BSC = {
  chainId: "0x38", chainName: "BNB Smart Chain", nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: ["https://bsc-dataseed.binance.org"], blockExplorerUrls: ["https://bscscan.com"],
};

export const toBps = (pct) => BigInt(Math.round(Number(pct || 0) * 100));
export const fmtUnits = (v, d, dp = 6) => Number(formatUnits(v, d)).toLocaleString(undefined, { maximumFractionDigits: dp });

const reader = (cfg) => new JsonRpcProvider(cfg.rpc_url);
const wbnb = (cfg) => cfg.wbnb_address || WBNB;

export const pathFor = (cfg, direction) =>
  direction === "BNB_TO_MERQ" ? [wbnb(cfg), cfg.merq_token_address] : [cfg.merq_token_address, wbnb(cfg)];

export async function loadMarket(cfg) {
  const p = reader(cfg);
  const [merqDec, pair] = await Promise.all([
    new Contract(cfg.merq_token_address, ERC20, p).decimals(),
    new Contract(cfg.factory_address, FACTORY, p).getPair(wbnb(cfg), cfg.merq_token_address),
  ]);
  const dec = { bnb: 18, merq: Number(merqDec) };
  if (pair === ZeroAddress) return { pair: null, dec };
  const pc = new Contract(pair, PAIR, p);
  const [[r0, r1], t0] = await Promise.all([pc.getReserves(), pc.token0()]);
  const bnbIs0 = t0.toLowerCase() === wbnb(cfg).toLowerCase();
  const reserves = { bnb: bnbIs0 ? r0 : r1, merq: bnbIs0 ? r1 : r0 };
  if (reserves.bnb === 0n || reserves.merq === 0n) return { pair: null, dec };
  const price = Number(formatUnits(reserves.bnb, 18)) / Number(formatUnits(reserves.merq, dec.merq));
  return { pair, dec, reserves, price };
}

export async function getBalances(cfg, address, dec) {
  const p = reader(cfg);
  const [b, m] = await Promise.all([p.getBalance(address), new Contract(cfg.merq_token_address, ERC20, p).balanceOf(address)]);
  return { bnb: b, merq: m, dec };
}

export async function quoteOut(cfg, direction, netInWei) {
  if (netInWei <= 0n) return 0n;
  const amounts = await new Contract(cfg.router_address, ROUTER, reader(cfg)).getAmountsOut(netInWei, pathFor(cfg, direction));
  return amounts[amounts.length - 1];
}

export const parseAmount = (v, dec) => {
  try { return v ? parseUnits(String(v), dec) : 0n; } catch { return 0n; }
};

export async function ensureChain() {
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BSC.chainId }] });
  } catch (e) {
    if (e.code !== 4902) throw e;
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [BSC] });
  }
}

// fee transfer -> approve (MERQ only) -> swap; onStep reports progress
export async function executeSwap({ cfg, direction, amountWei, minOutWei, memberAddress, onStep }) {
  if (!window.ethereum) throw new Error("No wallet detected. Open this page in MetaMask or Trust Wallet.");
  await ensureChain();
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const me = await signer.getAddress();
  if (memberAddress && me.toLowerCase() !== memberAddress.toLowerCase()) {
    throw new Error("Switch MetaMask to the wallet you signed in with.");
  }
  const buying = direction === "BNB_TO_MERQ";
  const token = new Contract(cfg.merq_token_address, ERC20, signer);
  const feeWei = cfg.fee_wallet ? (amountWei * toBps(cfg.fee_pct)) / 10000n : 0n;
  const netWei = amountWei - feeWei;
  let feeTxHash = null;
  if (feeWei > 0n) {
    onStep("fee");
    const tx = buying ? await signer.sendTransaction({ to: cfg.fee_wallet, value: feeWei }) : await token.transfer(cfg.fee_wallet, feeWei);
    feeTxHash = tx.hash;
    await tx.wait();
  }
  if (!buying && (await token.allowance(me, cfg.router_address)) < netWei) {
    onStep("approve");
    await (await token.approve(cfg.router_address, netWei)).wait();
  }
  onStep("swap");
  const router = new Contract(cfg.router_address, ROUTER, signer);
  const deadline = Math.floor(Date.now() / 1000) + 600;
  const path = pathFor(cfg, direction);
  const tx = buying
    ? await router.swapExactETHForTokensSupportingFeeOnTransferTokens(minOutWei, path, me, deadline, { value: netWei })
    : await router.swapExactTokensForETHSupportingFeeOnTransferTokens(netWei, minOutWei, path, me, deadline);
  onStep("confirm");
  await tx.wait();
  return { txHash: tx.hash, feeTxHash, feeWei };
}
