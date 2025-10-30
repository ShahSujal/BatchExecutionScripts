import { ethers } from "ethers";

// Define interfaces for CCTP API responses
interface AttestationMessage {
  attestation: string;
  message: string;
  eventNonce: string;
}

interface AttestationResponse {
  messages: AttestationMessage[];
}

// Chain configuration for Sepolia and Arbitrum Sepolia
type NetworkConfig = {
  RPC: string;
  TokenMessenger: string;
  MessageTransmitter: string;
  TokenMinter: string;
  USDCAddress: string;
};

// Contract ABIs
const erc20Abi = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
];

const tokenMessengerAbi = [
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold)",
];

const messageTransmitterAbi = [
  "function receiveMessage(bytes message, bytes attestation)",
];

// CCTP V2 Finality Thresholds
enum FinalityThreshold {
  Fast = 1000, // Fast Transfer
  Standard = 2000, // Standard / Slow Transfer
}

// IRIS API configuration
const IRIS_CONFIG = {
  TESTNET_URL: "https://iris-api-sandbox.circle.com/v2",
  MAINNET_URL: "https://iris-api.circle.com/v2",
};

// Chain configurations
const ethereumSepoliaConfig: NetworkConfig = {
  RPC: "https://ethereum-sepolia-rpc.publicnode.com",
  TokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  MessageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
  TokenMinter: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192",
  USDCAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
};

const arbitrumSepoliaConfig: NetworkConfig = {
  RPC: "https://arbitrum-sepolia-rpc.publicnode.com",
  TokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  MessageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
  TokenMinter: "0xb43db544E2c27092c107639Ad201b3dEfABcF192",
  USDCAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
};

// Domain IDs for CCTP
const SEPOLIA_DOMAIN = 0;
const ARBITRUM_SEPOLIA_DOMAIN = 3;

/**
 * Adds a percentage buffer to a gas estimate to account for potential fluctuations
 */
function addGasBuffer(gasEstimate: bigint, bufferPercent: number = 20): bigint {
  return (BigInt(gasEstimate) * BigInt(100 + bufferPercent)) / BigInt(100);
}

/**
 * Adds a percentage buffer to the burn fee to account for potential fluctuations
 */
function addBurnFeeBuffer(amount: bigint | string, burnFeeBasisPoints: bigint, bufferBasisPoints = 5): bigint {
  return (BigInt(amount) * (BigInt(burnFeeBasisPoints) + BigInt(bufferBasisPoints))) / BigInt(10000);
}

/**
 * Gets the fast burn fees for USDC on the source chain to the destination chain
 */
async function getUsdcFastBurnFees(sourceDomain: number, destinationDomain: number): Promise<{ minimumFee: bigint }> {
  const url = `${IRIS_CONFIG.TESTNET_URL}/fastBurn/USDC/fees/${sourceDomain}/${destinationDomain}`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch USDC fast burn fees: ${response.statusText}`);
  }
  const data = await response.json();
  return { minimumFee: BigInt(data.minimumFee || 0) };
}

/**
 * Gets the fast burn allowance for USDC
 */
async function getFastBurnAllowance(): Promise<{ allowance: number }> {
  const url = `${IRIS_CONFIG.TESTNET_URL}/fastBurn/USDC/allowance`;
  const options = { method: 'GET', headers: { 'Content-Type': 'application/json' } };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch fast burn allowance: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetches the attestation from Iris API for CCTP V2
 */
async function fetchAttestation(txHash: string, domainId: number): Promise<AttestationMessage> {
  console.log("Fetching attestation...");
  let attestationResponse: any = {};
  
  while (true) {
    const response = await fetch(
      `${IRIS_CONFIG.TESTNET_URL}/messages/${domainId}?transactionHash=${txHash}`
    );
    
    attestationResponse = await response.json();
    
    if (
      attestationResponse.error ||
      !attestationResponse.messages ||
      attestationResponse.messages?.[0]?.attestation === "PENDING"
    ) {
      console.log("Attestation pending, waiting 2 seconds...");
      await new Promise((r) => setTimeout(r, 2000));
    } else {
      break;
    }
  }
  
  console.log("Attestation received successfully");
  return attestationResponse.messages[0];
}

/**
 * Main function to bridge USDC from Sepolia to Arbitrum Sepolia
 */
async function bridgeUSDCFromSepoliaToArbitrumSepolia(
  privateKey: string,
  amount: string,
  destinationAddress: string
): Promise<void> {
  console.log("Starting USDC bridge from Sepolia to Arbitrum Sepolia...");
  
  // Convert amount to BigInt (USDC has 6 decimals)
  const amountInBaseUnits = ethers.parseUnits(amount, 6);
  console.log(`Amount to bridge: ${amount} USDC (${amountInBaseUnits} base units)`);
  
  // Setup wallet and providers
  const sourceProvider = new ethers.JsonRpcProvider(ethereumSepoliaConfig.RPC);
  const destinationProvider = new ethers.JsonRpcProvider(arbitrumSepoliaConfig.RPC);
  const wallet = new ethers.Wallet(privateKey, sourceProvider);
  
  console.log(`Using wallet address: ${wallet.address}`);
  
  // Check wallet balances
  const sourceBalance = await sourceProvider.getBalance(wallet.address);
  console.log(`Source chain ETH balance: ${ethers.formatEther(sourceBalance)} ETH`);
  
  // Initialize contracts
  const usdcContract = new ethers.Contract(
    ethereumSepoliaConfig.USDCAddress,
    erc20Abi,
    wallet
  );
  
  const tokenMessengerContract = new ethers.Contract(
    ethereumSepoliaConfig.TokenMessenger,
    tokenMessengerAbi,
    wallet
  );
  
  // Check USDC balance
  try {
    if (usdcContract.balanceOf) {
      const usdcBalance = await usdcContract.balanceOf(wallet.address);
      console.log(`USDC balance on Sepolia: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
      
      if (usdcBalance < amountInBaseUnits) {
        throw new Error(`Insufficient USDC balance. Required: ${amount}, Available: ${ethers.formatUnits(usdcBalance, 6)}`);
      }
    } else {
      throw new Error("USDC contract balanceOf method not available");
    }
  } catch (error) {
    console.error("Error checking USDC balance:", error);
    throw error;
  }
  
  // Verify fast burn allowance
  const allowance = await getFastBurnAllowance();
  const allowanceInTokenUnits = ethers.parseUnits(allowance.allowance.toString(), 6);
  
  if (allowanceInTokenUnits < amountInBaseUnits) {
    throw Error(`Insufficient allowance for fast burn (allowance: ${allowance.allowance})`);
  }
  
  console.log(`Enough CCTP V2 fast transfer allowance (${allowance.allowance}), proceeding with transfer...`);
  
  // Format destination address as bytes32
  const destinationAddressBytes32 = ethers.zeroPadValue(destinationAddress, 32);
  const destinationCallerBytes32 = ethers.ZeroHash; // Zero hash allows any caller
  
  // Calculate max burn fee
  console.log("Calculating max burn fee...");
  const fastBurnFeeResponse = await getUsdcFastBurnFees(SEPOLIA_DOMAIN, ARBITRUM_SEPOLIA_DOMAIN);
  const maxFee = addBurnFeeBuffer(amountInBaseUnits, fastBurnFeeResponse.minimumFee);
  console.log(`Calculated max burn fee with buffer: ${maxFee}`);
  
  // Step 1: Approve USDC for transfer
  console.log("Approving USDC...");
  if (!usdcContract.approve) {
    throw new Error("USDC contract approve method not available");
  }
  
  const gasEstimateApprove = await usdcContract.approve.estimateGas(
    ethereumSepoliaConfig.TokenMessenger,
    amountInBaseUnits
  );
  
  const gasLimitApprove = addGasBuffer(gasEstimateApprove);
  console.log(`Estimated gas with buffer for approval: ${gasLimitApprove.toString()}`);
  
  const approveTx = await usdcContract.approve(
    ethereumSepoliaConfig.TokenMessenger,
    amountInBaseUnits,
    { gasLimit: gasLimitApprove }
  );
  
  console.log(`Approval transaction submitted: ${approveTx.hash}`);
  const approveTxReceipt = await approveTx.wait();
  console.log(`Approval transaction confirmed in block: ${approveTxReceipt?.blockNumber}`);
  
  // Step 2: Burn USDC
  console.log("Burning USDC...");
  if (!tokenMessengerContract.depositForBurn) {
    throw new Error("Token messenger contract depositForBurn method not available");
  }
  
  const gasEstimateBurn = await tokenMessengerContract.depositForBurn.estimateGas(
    amountInBaseUnits,
    ARBITRUM_SEPOLIA_DOMAIN,
    destinationAddressBytes32,
    ethereumSepoliaConfig.USDCAddress,
    destinationCallerBytes32,
    maxFee,
    FinalityThreshold.Fast
  );
  
  const gasLimitBurn = addGasBuffer(gasEstimateBurn);
  console.log(`Estimated gas with buffer for burn: ${gasLimitBurn.toString()}`);
  
  const burnTx = await tokenMessengerContract.depositForBurn(
    amountInBaseUnits,
    ARBITRUM_SEPOLIA_DOMAIN,
    destinationAddressBytes32,
    ethereumSepoliaConfig.USDCAddress,
    destinationCallerBytes32,
    maxFee,
    FinalityThreshold.Fast,
    { gasLimit: gasLimitBurn }
  );
  
  console.log(`Burn transaction submitted: ${burnTx.hash}`);
  const burnTxReceipt = await burnTx.wait();
  console.log(`Burn transaction confirmed in block: ${burnTxReceipt?.blockNumber}`);
  
  // Step 3: Get attestation
  console.log("Getting attestation...");
  const attestation = await fetchAttestation(burnTx.hash, SEPOLIA_DOMAIN);
  
  if (!attestation || !attestation.attestation || !attestation.message) {
    throw new Error("Failed to get valid attestation");
  }
  
  console.log("Attestation received:", {
    attestation: attestation.attestation.substring(0, 20) + "...",
    message: attestation.message.substring(0, 20) + "..."
  });
  
  // Step 4: Receive message on destination chain
  console.log("Receiving message on Arbitrum Sepolia...");
  
  // Connect wallet to destination chain
  const destinationWallet = new ethers.Wallet(privateKey, destinationProvider);
  
  const messageTransmitterContract = new ethers.Contract(
    arbitrumSepoliaConfig.MessageTransmitter,
    messageTransmitterAbi,
    destinationWallet
  );
  
  if (!messageTransmitterContract.receiveMessage) {
    throw new Error("MessageTransmitter receiveMessage method not available");
  }
  
  // Format message and attestation
  const messageBytes = attestation.message.startsWith("0x") ? attestation.message : "0x" + attestation.message;
  const attestationBytes = attestation.attestation.startsWith("0x") ? attestation.attestation : "0x" + attestation.attestation;
  
  // Estimate gas for receiving message
  const gasEstimateReceive = await messageTransmitterContract.receiveMessage.estimateGas(
    messageBytes,
    attestationBytes
  );
  
  const gasLimitReceive = addGasBuffer(gasEstimateReceive);
  console.log(`Estimated gas with buffer for receiving message: ${gasLimitReceive.toString()}`);
  
  const receiveTx = await messageTransmitterContract.receiveMessage(
    messageBytes,
    attestationBytes,
    { gasLimit: gasLimitReceive }
  );
  
  console.log(`Receive message transaction submitted: ${receiveTx.hash}`);
  const receiveTxReceipt = await receiveTx.wait();
  console.log(`Receive message transaction confirmed in block: ${receiveTxReceipt?.blockNumber}`);
  
  console.log("USDC bridge from Sepolia to Arbitrum Sepolia completed successfully!");
  console.log(`Bridged ${amount} USDC to ${destinationAddress} on Arbitrum Sepolia`);
}

// Example usage
// Replace these values with your actual private key, amount, and destination address
async function main() {
  const privateKey = "YOUR_PRIVATE_KEY"; // Replace with your private key
  const amount = "10"; // Amount in USDC (e.g., 10 USDC)
  const destinationAddress = "YOUR_DESTINATION_ADDRESS"; // Replace with your destination address (can be the same as the sender)
  
  try {
    await bridgeUSDCFromSepoliaToArbitrumSepolia(privateKey, amount, destinationAddress);
  } catch (error) {
    console.error("Bridge operation failed:", error);
  }
}

// Run the main function
main();
