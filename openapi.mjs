// OpenAPI spec for Mint Safety Verdict — published free at /openapi.json so
// agents (and the Circle marketplace review) can read inputs, outputs, prices.

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Mint Safety Verdict",
    version: "0.1.0",
    description:
      "Pre-mint safety verdicts for BNB Smart Chain (chain 56) contracts, specialised in Binance Agent ID gated mints. " +
      "Basic tier returns Sourcify verification status plus a dangerous-pattern scan of the verified source. " +
      "Full verdict runs every automatable gate: verification, source scan, Agent ID gate evidence, on-chain supply, " +
      "plus AgenticMint radar context (score, unique minters, first seen). Gates that cannot be automated are reported " +
      "as UNKNOWN, never faked as PASS. Payments in USDC via x402 (Circle Gateway nanopayments + vanilla x402).",
  },
  servers: [{ url: "http://localhost:8402", description: "testnet build (host replaced at public deploy)" }],
  paths: {
    "/check": {
      get: {
        summary: "Basic contract check — is it verified and is the source clean?",
        description: "Price: $0.001 USDC per call, paid via x402. Unpaid requests receive 402 Payment Required.",
        parameters: [
          { name: "address", in: "query", required: true, schema: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" }, description: "BSC contract address (chain 56)." },
        ],
        responses: {
          "200": { description: "Basic check result", content: { "application/json": { schema: { $ref: "#/components/schemas/BasicCheck" } } } },
          "400": { description: "Invalid address" },
          "402": { description: "Payment required (x402)" },
        },
      },
    },
    "/verdict": {
      post: {
        summary: "Full mint safety verdict for one BSC contract",
        description: "Price: $0.05 USDC per call, paid via x402. Unpaid requests receive 402 Payment Required.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["address"], properties: { address: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$", description: "BSC contract address (chain 56)." } } } } },
        },
        responses: {
          "200": { description: "Full verdict", content: { "application/json": { schema: { $ref: "#/components/schemas/Verdict" } } } },
          "400": { description: "Invalid address" },
          "402": { description: "Payment required (x402)" },
        },
      },
    },
    "/health": {
      get: { summary: "Service health (free)", responses: { "200": { description: "OK" } } },
    },
  },
  components: {
    schemas: {
      Gate: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["PASS", "FAIL", "WARNING", "UNKNOWN"] },
          reason: { type: "string" },
        },
      },
      BasicCheck: {
        type: "object",
        properties: {
          address: { type: "string" },
          chain: { type: "integer", example: 56 },
          verified: { type: "object", properties: { status: { type: "string" }, sourcify_match: { type: "string", nullable: true }, reason: { type: "string" } } },
          clean_source: { $ref: "#/components/schemas/Gate" },
          checked_at: { type: "string", format: "date-time" },
        },
      },
      Verdict: {
        type: "object",
        properties: {
          address: { type: "string" },
          chain: { type: "integer", example: 56 },
          name: { type: "string", nullable: true },
          radar: { type: "object", properties: { listed: { type: "boolean" }, score: { type: "number", nullable: true }, unique_minters: { type: "integer", nullable: true }, first_seen: { type: "string", nullable: true } } },
          gates: { type: "object", additionalProperties: { $ref: "#/components/schemas/Gate" } },
          verdict: { type: "string", enum: ["PASS", "WARNING", "REJECT"] },
          verdict_explainer: { type: "string" },
          checked_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
