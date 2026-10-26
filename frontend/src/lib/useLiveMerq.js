import { useQuery } from "@tanstack/react-query";
import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { api } from "@/lib/api";

const ERC20 = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

async function tokenBalance(rpc, token, address) {
  const c = new Contract(token, ERC20, new JsonRpcProvider(rpc));
  const [wei, dec] = await Promise.all([c.balanceOf(address), c.decimals()]);
  return Number(formatUnits(wei, dec));
}

// Live MERQ + USDT balances of the connected wallet, read on-chain, plus live MERQ price
export function useLiveMerq(address) {
  const { data: p } = useQuery({ queryKey: ["merq-price"], queryFn: async () => (await api.get("/ports/price")).data, refetchInterval: 30000 });
  const merq = useQuery({
    queryKey: ["merq-balance", address, p?.token_address],
    queryFn: () => tokenBalance(p.rpc_url, p.token_address, address),
    enabled: !!(address && p?.token_address), refetchInterval: 20000,
  });
  const usdt = useQuery({
    queryKey: ["usdt-balance", address, p?.usdt_token_address],
    queryFn: () => tokenBalance(p.rpc_url, p.usdt_token_address, address),
    enabled: !!(address && p?.usdt_token_address), refetchInterval: 20000,
  });
  const bnb = useQuery({
    queryKey: ["bnb-balance", address],
    queryFn: async () => Number(formatUnits(await new JsonRpcProvider(p.rpc_url).getBalance(address), 18)),
    enabled: !!(address && p?.rpc_url), refetchInterval: 20000,
  });
  const live = !!p?.token_address;
  const balance = merq.data ?? null;
  return {
    live, price: p?.merq_price ?? 0, source: p?.price_source,
    balance, usd: balance !== null ? balance * (p?.merq_price ?? 0) : null,
    loading: !p || (live && merq.isLoading), error: merq.isError,
    usdt: usdt.data ?? null, usdtError: usdt.isError,
    bnb: bnb.data ?? null, bnbError: bnb.isError,
  };
}
