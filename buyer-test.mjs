// Self-pay end-to-end test (TESTNET): buyer wallet -> Gateway deposit -> pay our own endpoints.
// Private key is read from ~/.circle-lapak/test-wallets.json (mode 600). Never printed.
import { readFileSync } from "node:fs";
import { GatewayClient } from "@circle-fin/x402-batching/client";

const w = JSON.parse(readFileSync(process.env.HOME + "/.circle-lapak/test-wallets.json", "utf8"));
const client = new GatewayClient({ chain: "arcTestnet", privateKey: w.buyer.privateKey });

const BASE = process.env.SERVICE_BASE ?? "http://localhost:8402";
const TEST_ADDR = "0x55d398326f99059fF775485246999027B3197955"; // USDT on BSC — analysis target only

const balances = await client.getBalances();
console.log(`buyer wallet USDC (Arc Testnet): ${balances.wallet.formatted}`);
console.log(`gateway available: ${balances.gateway.formattedAvailable} USDC`);

if (balances.gateway.available < 1_000_000n) {
  if (balances.wallet.balance < 1_000_000n) {
    console.log(`NEED_FAUCET: buyer ${w.buyer.address} has insufficient Arc Testnet USDC. Fund it at https://faucet.circle.com (USDC, Arc Testnet), then re-run.`);
    process.exit(2);
  }
  console.log("Depositing 1 USDC into Gateway...");
  const dep = await client.deposit("1");
  console.log(`deposit tx: ${dep.depositTxHash}`);
  // wait for availability
  for (let i = 0; i < 30; i++) {
    const b = await client.getBalances();
    if (b.gateway.available >= 1_000_000n) { console.log(`gateway available now: ${b.gateway.formattedAvailable}`); break; }
    await new Promise(r => setTimeout(r, 4000));
  }
}

const checkUrl = `${BASE}/check?address=${TEST_ADDR}`;
const sup = await client.supports(checkUrl);
console.log("supports Gateway:", JSON.stringify(sup));
if (!sup.supported) { console.log("Endpoint does not support Gateway payments — abort."); process.exit(1); }

console.log("Paying /check ($0.001)...");
const r1 = await client.pay(checkUrl);
console.log(`check status: ${r1.status}`);
console.log("check data:", JSON.stringify(r1.data));

console.log("Paying /verdict ($0.05)...");
try {
  const r2 = await client.pay(`${BASE}/verdict`, { method: "POST", body: { address: TEST_ADDR } });
  console.log(`verdict status: ${r2.status}`);
  console.log("verdict data:", JSON.stringify(r2.data).slice(0, 800));
} catch (e) {
  console.log("verdict POST pay failed:", String(e).slice(0, 300));
}

const after = await client.getBalances();
console.log(`gateway available after: ${after.gateway.formattedAvailable} USDC`);
