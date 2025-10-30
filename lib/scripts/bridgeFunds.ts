import 'dotenv/config';
import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { ethers } from "ethers";

// CCTP V2 Finality Thresholds
enum FinalityThreshold {
  Fast = 1000, // Fast Transfer
  Standard = 2000, // Standard / Slow Transfer
}

// Solana devnet configuration
const SOLANA_CONFIG = {
  DOMAIN_ID: 5,
  USDC_MINT: new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
  MESSAGE_TRANSMITTER_PROGRAM: new PublicKey("CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC"),
  TOKEN_MESSENGER_MINTER_PROGRAM: new PublicKey("CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe"),
}

// EVM Chain Configurations
const ETHEREUM_SEPOLIA_CONFIG = {
  DOMAIN_ID: 0,
  RPC: "https://ethereum-sepolia-rpc.publicnode.com",
  MESSAGE_TRANSMITTER: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
  USDC_ADDRESS: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
};

const ARBITRUM_SEPOLIA_CONFIG = {
  DOMAIN_ID: 3,
  RPC: "https://arbitrum-sepolia-rpc.publicnode.com",
  MESSAGE_TRANSMITTER: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
  USDC_ADDRESS: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
};

// IRIS API URL for testnet
const IRIS_API_URL = "https://iris-api-sandbox.circle.com/v2";

interface FindProgramAddressResponse {
  publicKey: PublicKey;
  bump: number;
}

interface FastBurnResponse {
  minimumFee: bigint;
}

interface FastBurnAllowanceResponse {
  allowance: number;
}

interface AttestationMessage {
  attestation: string;
  message: string;
  eventNonce: string;
}

/**
 * Gets the fast burn fees for USDC on the source chain to the destination chain
 */
async function getUsdcFastBurnFees(sourceDomain: number, destinationDomain: number): Promise<FastBurnResponse> {
  const url = `${IRIS_API_URL}/fastBurn/USDC/fees/${sourceDomain}/${destinationDomain}`;
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
  return response.json() as Promise<FastBurnResponse>;
}

/**
 * Gets the fast burn allowance for USDC
 */
async function getFastBurnAllowance(): Promise<FastBurnAllowanceResponse> {
  const url = `${IRIS_API_URL}/fastBurn/USDC/allowance`;
  const options = { method: 'GET', headers: { 'Content-Type': 'application/json' } };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch USDC fast burn allowance: ${response.statusText}`);
  }
  return response.json() as Promise<FastBurnAllowanceResponse>;
}

/**
 * Adds a percentage buffer to the burn fee to account for potential fluctuations
 */
function addBurnFeeBuffer(amount: bigint | string, burnFeeBasisPoints: bigint, bufferBasisPoints = 5): bigint {
  return (BigInt(amount) * (BigInt(burnFeeBasisPoints) + BigInt(bufferBasisPoints))) / BigInt(10000);
}

/**
 * Fetches the attestation from Iris API for CCTP V2
 */
async function fetchAttestation(txHash: string, domainId: number) {
  console.log("Fetching attestation...");
  let attestationResponse: any = {};
  while (true) {
    const response = await fetch(
      `${IRIS_API_URL}/messages/${domainId}?transactionHash=${txHash}`
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

// Utility function to find program addresses
const findProgramAddress = (
  label: string,
  programId: PublicKey,
  extraSeeds?: (string | number[] | Buffer | PublicKey)[]
): FindProgramAddressResponse => {
  const seeds: Uint8Array[] = [Buffer.from(anchor.utils.bytes.utf8.encode(label))];
  if (extraSeeds) {
    for (const extraSeed of extraSeeds) {
      if (typeof extraSeed === "string") {
        seeds.push(Buffer.from(anchor.utils.bytes.utf8.encode(extraSeed)));
      } else if (Array.isArray(extraSeed)) {
        seeds.push(Buffer.from(extraSeed as number[]));
      } else if (Buffer.isBuffer(extraSeed)) {
        seeds.push(new Uint8Array(extraSeed));
      } else {
        seeds.push(new Uint8Array(extraSeed.toBuffer()));
      }
    }
  }
  const res = PublicKey.findProgramAddressSync(seeds, programId);
  return { publicKey: res[0], bump: res[1] };
};

// Get all PDAs needed for depositForBurn
const getDepositForBurnPdas = (
  messageTransmitterProgram: anchor.Program,
  tokenMessengerMinterProgram: anchor.Program,
  usdcAddress: PublicKey,
  destinationDomain: number
) => {
  const messageTransmitterAccount = findProgramAddress(
    "message_transmitter",
    messageTransmitterProgram.programId
  );
  const tokenMessengerAccount = findProgramAddress(
    "token_messenger",
    tokenMessengerMinterProgram.programId
  );
  const tokenMinterAccount = findProgramAddress(
    "token_minter",
    tokenMessengerMinterProgram.programId
  );
  const localToken = findProgramAddress(
    "local_token",
    tokenMessengerMinterProgram.programId,
    [usdcAddress]
  );
  const remoteTokenMessengerKey = findProgramAddress(
    "remote_token_messenger",
    tokenMessengerMinterProgram.programId,
    [destinationDomain.toString()]
  );
  const authorityPda = findProgramAddress(
    "sender_authority",
    tokenMessengerMinterProgram.programId
  );

  return {
    messageTransmitterAccount,
    tokenMessengerAccount,
    tokenMinterAccount,
    localToken,
    remoteTokenMessengerKey,
    authorityPda,
  };
};

// Convert destination address to 32-byte format for Solana
const destinationAddressToBytes32 = (destinationAddress: string): Uint8Array => {
  return ethers.getBytes(destinationAddress);
};

/**
 * Execute depositForBurn on Solana
 */
async function depositForBurnSolana(
  rpcUrl: string,
  privateKey: string,
  amount: string | bigint,
  destinationAddress: string,
  destinationDomain: number,
  maxFee?: string | bigint,
  minFinalityThreshold?: FinalityThreshold
): Promise<string> {
  console.log(`Starting USDC burn on Solana to domain ${destinationDomain}...`);

  // Verify that there is enough allowance for the amount we wish to transfer
  if (minFinalityThreshold === FinalityThreshold.Fast) {
    const allowance = await getFastBurnAllowance();
    const allowanceInTokenUnits = ethers.parseUnits(allowance.allowance.toString(), 6);

    if (allowanceInTokenUnits < BigInt(amount)) {
      throw Error(`Insufficient allowance for fast burn (allowance: ${allowance.allowance})`);
    }

    console.log(`Enough CCTP V2 fast transfer allowance (${allowance.allowance}), proceeding with transfer...`);
  }

  const connection = new Connection(rpcUrl, "confirmed");
  const seed = anchor.utils.bytes.bs58.decode(privateKey);
  const keypair = Keypair.fromSecretKey(seed);
  const wallet = new anchor.Wallet(keypair);

  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const usdcAddress = SOLANA_CONFIG.USDC_MINT;

  // Get or create associated token account for USDC
  const usdcTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
    connection,
    wallet.payer,
    usdcAddress,
    wallet.publicKey
  );

  console.log("USDC token account:", usdcTokenAccount.address.toString());

  // Initialize programs
  const messageTransmitterProgram = await anchor.Program.at(
    SOLANA_CONFIG.MESSAGE_TRANSMITTER_PROGRAM,
    provider
  );
  const tokenMessengerMinterProgram = await anchor.Program.at(
    SOLANA_CONFIG.TOKEN_MESSENGER_MINTER_PROGRAM,
    provider
  );

  // Get PDAs
  const pdas = getDepositForBurnPdas(
    messageTransmitterProgram,
    tokenMessengerMinterProgram,
    usdcAddress,
    destinationDomain
  );

  // Generate keypair for message sent event account
  const messageSentEventAccountKeypair = Keypair.generate();

  // Calculate max burn fee, if necessary
  if (minFinalityThreshold === FinalityThreshold.Standard) {
    console.log("Performing Standard Transfer, setting max burn fee to 0");
    maxFee = BigInt(0);
  } else if (!maxFee) {
    console.log("Calculating max burn fee...");
    const fastBurnFeeResponse = await getUsdcFastBurnFees(SOLANA_CONFIG.DOMAIN_ID, destinationDomain);
    maxFee = addBurnFeeBuffer(amount, fastBurnFeeResponse.minimumFee);
    console.log(`Calculated max burn fee with buffer: ${maxFee}`);
  }

  try {
    if (!tokenMessengerMinterProgram.methods?.depositForBurn) {
      throw new Error("Token messenger minter program depositForBurn method not available");
    }

    const destinationCaller = new PublicKey(PublicKey.default.toString()); // Default caller
    // Convert destination address to 32-byte format
    const mintRecipient = new PublicKey(destinationAddressToBytes32(destinationAddress));

    const tx = await tokenMessengerMinterProgram.methods
      .depositForBurn({
        amount: new anchor.BN(amount),
        destinationDomain: destinationDomain,
        mintRecipient: mintRecipient,
        maxFee: new anchor.BN(maxFee),
        minFinalityThreshold: minFinalityThreshold || FinalityThreshold.Fast,
        destinationCaller: destinationCaller,
      })
      .accounts({
        owner: wallet.publicKey,
        eventRentPayer: wallet.publicKey,
        senderAuthorityPda: pdas.authorityPda.publicKey,
        burnTokenAccount: usdcTokenAccount.address,
        messageTransmitter: pdas.messageTransmitterAccount.publicKey,
        tokenMessenger: pdas.tokenMessengerAccount.publicKey,
        remoteTokenMessenger: pdas.remoteTokenMessengerKey.publicKey,
        tokenMinter: pdas.tokenMinterAccount.publicKey,
        localToken: pdas.localToken.publicKey,
        burnTokenMint: usdcAddress,
        messageSentEventData: messageSentEventAccountKeypair.publicKey,
        messageTransmitterProgram: messageTransmitterProgram.programId,
        tokenMessengerMinterProgram: tokenMessengerMinterProgram.programId,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([messageSentEventAccountKeypair])
      .rpc();

    console.log(`DepositForBurn transaction signature: ${tx}`);
    return tx;
  } catch (error) {
    console.error("Error in depositForBurn:", error);
    throw error;
  }
}

/**
 * Receives (mints) funds on the destination EVM chain
 */
async function receiveMessageEvm(
  message: string,
  attestation: string,
  evmRpcUrl: string,
  evmPrivateKey: string,
  messageTransmitterContractAddress: string
): Promise<string> {
  console.log("Receiving message on EVM chain...");

  const provider = new ethers.JsonRpcProvider(evmRpcUrl);
  const wallet = new ethers.Wallet(evmPrivateKey, provider);

  const messageTransmitterAbi = [
    "function receiveMessage(bytes message, bytes attestation)"
  ];

  const messageTransmitterContract = new ethers.Contract(
    messageTransmitterContractAddress,
    messageTransmitterAbi,
    wallet
  );

  try {
    if (!messageTransmitterContract.receiveMessage) {
      throw new Error("MessageTransmitter receiveMessage method not available");
    }

    // Convert hex strings to proper format for ethers
    const messageBytes = message.startsWith("0x") ? message : "0x" + message;
    const attestationBytes = attestation.startsWith("0x") ? attestation : "0x" + attestation;

    // Estimate gas for the transaction
    const gasEstimate = await messageTransmitterContract.receiveMessage.estimateGas(
      messageBytes,
      attestationBytes
    );

    // Add 20% buffer to gas estimate
    const gasLimit = (BigInt(gasEstimate) * BigInt(120)) / BigInt(100);

    const tx = await messageTransmitterContract.receiveMessage(
      messageBytes,
      attestationBytes,
      { gasLimit }
    );

    console.log("ReceiveMessage transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt?.blockNumber);

    return tx.hash;
  } catch (error) {
    console.error("Error in receiveMessage:", error);
    throw error;
  }
}
// solana -> quote -> txn params -> execute on chain

// Solana -> arbitrum
/**
 * Main function to transfer USDC from Solana devnet to Arbitrum Sepolia and Ethereum Sepolia
 */
async function transferUsdcFromSolanaToEvmChains(
  solanaPrivateKey: string,
  ethereumPrivateKey: string,
  arbitrumPrivateKey: string,
  amount: string,
  ethereumDestinationAddress: string,
  arbitrumDestinationAddress: string
) {
  // Convert amount to USDC units (6 decimals)
  const amountInUsdcUnits = ethers.parseUnits(amount, 6);
  
  console.log(`Starting USDC transfer of ${amount} from Solana devnet to Ethereum Sepolia and Arbitrum Sepolia`);
  
  // 1. First transfer: Solana to Ethereum Sepolia
  console.log("=== Transfer 1: Solana to Ethereum Sepolia ===");
  
  // Burn USDC on Solana for Ethereum Sepolia
  const burnTxEthereum = await depositForBurnSolana(
    "https://api.devnet.solana.com",
    solanaPrivateKey,
    amountInUsdcUnits,
    ethereumDestinationAddress,
    ETHEREUM_SEPOLIA_CONFIG.DOMAIN_ID,
    undefined,
    FinalityThreshold.Fast
  );
  
  console.log(`Burn transaction for Ethereum Sepolia completed: ${burnTxEthereum}`);
  
  // Get attestation for Ethereum Sepolia transfer
  console.log("Waiting for attestation...");
  const ethereumAttestation = await fetchAttestation(burnTxEthereum, SOLANA_CONFIG.DOMAIN_ID);
  
  if (!ethereumAttestation || !ethereumAttestation.attestation || !ethereumAttestation.message) {
    throw new Error("Failed to get valid attestation for Ethereum Sepolia transfer");
  }
  
  console.log("Attestation received, proceeding to mint on Ethereum Sepolia");
  
  // Mint USDC on Ethereum Sepolia
  const mintTxEthereum = await receiveMessageEvm(
    ethereumAttestation.message,
    ethereumAttestation.attestation,
    ETHEREUM_SEPOLIA_CONFIG.RPC,
    ethereumPrivateKey,
    ETHEREUM_SEPOLIA_CONFIG.MESSAGE_TRANSMITTER
  );
  
  console.log(`Successfully minted USDC on Ethereum Sepolia: ${mintTxEthereum}`);
  
  // 2. Second transfer: Solana to Arbitrum Sepolia
  console.log("=== Transfer 2: Solana to Arbitrum Sepolia ===");
  
  // Burn USDC on Solana for Arbitrum Sepolia
  const burnTxArbitrum = await depositForBurnSolana(
    "https://api.devnet.solana.com",
    solanaPrivateKey,
    amountInUsdcUnits,
    arbitrumDestinationAddress,
    ARBITRUM_SEPOLIA_CONFIG.DOMAIN_ID,
    undefined,
    FinalityThreshold.Fast
  );
  
  console.log(`Burn transaction for Arbitrum Sepolia completed: ${burnTxArbitrum}`);
  
  // Get attestation for Arbitrum Sepolia transfer
  console.log("Waiting for attestation...");
  const arbitrumAttestation = await fetchAttestation(burnTxArbitrum, SOLANA_CONFIG.DOMAIN_ID);
  
  if (!arbitrumAttestation || !arbitrumAttestation.attestation || !arbitrumAttestation.message) {
    throw new Error("Failed to get valid attestation for Arbitrum Sepolia transfer");
  }
  
  console.log("Attestation received, proceeding to mint on Arbitrum Sepolia");
  
  // Mint USDC on Arbitrum Sepolia
  const mintTxArbitrum = await receiveMessageEvm(
    arbitrumAttestation.message,
    arbitrumAttestation.attestation,
    ARBITRUM_SEPOLIA_CONFIG.RPC,
    arbitrumPrivateKey,
    ARBITRUM_SEPOLIA_CONFIG.MESSAGE_TRANSMITTER
  );
  
  console.log(`Successfully minted USDC on Arbitrum Sepolia: ${mintTxArbitrum}`);
  
  console.log("=== Summary ===");
  console.log(`Transfer 1: ${amount} USDC from Solana to Ethereum Sepolia`);
  console.log(`- Burn TX: ${burnTxEthereum}`);
  console.log(`- Mint TX: ${mintTxEthereum}`);
  console.log(`Transfer 2: ${amount} USDC from Solana to Arbitrum Sepolia`);
  console.log(`- Burn TX: ${burnTxArbitrum}`);
  console.log(`- Mint TX: ${mintTxArbitrum}`);
}

// Example usage:
// Replace these values with your actual private keys and addresses
// transferUsdcFromSolanaToEvmChains(
//   "YOUR_SOLANA_PRIVATE_KEY",
//   "YOUR_ETHEREUM_PRIVATE_KEY",
//   "YOUR_ARBITRUM_PRIVATE_KEY",
//   "1.0", // Amount in USDC
//   "0xYourEthereumAddress",
//   "0xYourArbitrumAddress"
// );


// POST https://api.testnets.relay.link/currencies/v2
// Content-Type: application/json

// {
//   "chainIds": [792703809],
//   "limit": 100
// }

// POST https://api.testnets.relay.link/quote
// Content-Type: application/json

// {
//   "user": "YOUR_ADDRESS",
//   "originChainId": 792703809,
//   "destinationChainId": YOUR_DEST_CHAIN,
//   "originCurrency": "TOKEN_ADDRESS",
//   "destinationCurrency": "TOKEN_ADDRESS",
//   "amount": "AMOUNT_IN_WEI",
//   "tradeType": "EXACT_INPUT"
// }