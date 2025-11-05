import crypto from "crypto";
import fetch from "node-fetch";

// 1) Canonical JSON (sorted keys, no whitespace, recursive)
function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const keys = Object.keys(value).sort();
  const entries = keys.map(k => `${JSON.stringify(k)}:${canonicalize(value[k])}`);
  return `{${entries.join(",")}}`;
}

// 2) Create HMAC-SHA256 signature (hex) using your Client Secret
function createSignature(bodyObj, clientSecret) {
  const canonical = bodyObj ? canonicalize(bodyObj) : "";
  return crypto.createHmac("sha256", clientSecret).update(canonical, "utf8").digest("hex");
}

// Example: sign and call POST /v1/quote
async function requestQuote({ clientId, clientSecret }) {
  const body = {
    "fromChain": "1",
    "fromToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "fromAddress": "0x0B776F61BbAb470e10F6C890b7dBc420a3D73DE0",
    "toChain": "8453",
    "toToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "intent": { "method": "toAmount", "value": "1000000000" },
    "settlementDetails": {
      "toChain": "8453",// Base
      "toToken": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC on Base
      "toAddress": "0x0B776F61BbAb470e10F6C890b7dBc420a3D73DE0"
    }
  };

  const signature = createSignature(body, clientSecret);

  const res = await fetch("https://api.orda.network/v1/quote", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-client-id": clientId,
      "x-signature": signature,
      "x-timestamp": String(Date.now())
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

requestQuote({
  clientId: "",
  clientSecret: ""
}).then(quote => {
    console.log("🚀 Quote response:", quote);
  })
  .catch(err => {
    console.error("❌ Error fetching quote:", err);
  });

  // ❌ Error fetching quote: Error: HTTP 400: {"error":"BadRequest","message":"fromAddress: Required","correlationId":"cae05a84-733c-4c5c-a7a9-195a3ebd08ca","_timing":{"total_request":{"duration":18}}}

  //  {"error":"BadRequest","message":"recipientId: Provide either recipientId OR settlementDetails, not both","correlationId":"eee15224-9650-4cb2-8795-b978adc53052","_timing":{"total_request":{"duration":28}}}


// Example response:// 🚀 Quote response: {
//   id: 'offr_1234567890abcdef',
//   status: 'PENDING',
//   fromChain: '1',
//