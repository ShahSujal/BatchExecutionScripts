// curl -X POST https://api.orda.network/v1/offramp/quote \
//   -H "Content-Type: application/json" \
//   -H "x-client-id: YOUR_CLIENT_ID" \
//   -H "x-signature: YOUR_HMAC_SIGNATURE" \
//   -d '{
//     "fromChain": "1",                          // Ethereum
//     "fromToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
//     "fromAddress": "0xYourSender",
//     "intent": { "method": "fromAmount", "value": "1000000000" }, // 1000 USDC (6dp)
//     "kycInformation": {
//       "taxId": "12345678901",
//       "taxIdCountry": "BRA",
//       "email": "user@example.com",
//       "name": "User Name"
//     },
//     "fiatSettlementDetails": {
//       "toCurrency": "BRL",
//       "bankAccount": "0001234567",
//       "bankBranch": "0001",
//       "bankAccountType": "CHECKING",
//       "iban": "",
//       "pixKey": "",       // optional if using bank fields instead of PIX
//       "cbuCvu": ""        // for AR if applicable
//     }
//   }'