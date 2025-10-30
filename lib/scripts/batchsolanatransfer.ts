// import {
//   Connection,
//   PublicKey,
//   Transaction,
//   TransactionInstruction,
//   sendAndConfirmTransaction,
//   Keypair,
//   SystemProgram,
//   LAMPORTS_PER_SOL,
// } from "@solana/web3.js";

 
// export async function solanaRequestAirdrop(connection: Connection, publicKey: PublicKey, amount: number = 2 * LAMPORTS_PER_SOL) {
//   try {
//     console.log(`Requesting airdrop of ${amount / LAMPORTS_PER_SOL} SOL for ${publicKey.toString()}`);
//     const signature = await connection.requestAirdrop(publicKey, amount);
//     const latestBlockHash = await connection.getLatestBlockhash();
    
//     await connection.confirmTransaction({
//       blockhash: latestBlockHash.blockhash,
//       lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
//       signature: signature,
//     });
    
//     console.log(`Airdrop successful! Signature: ${signature}`);
//     return signature;
//   } catch (error) {
//     console.error('Airdrop failed:', error);
//     throw error;
//   }
// }

// const client = initiateUserControlledWalletsClient({
//   apiKey: "TEST_API_KEY:d48b9fbae3d8d21cf142213aad1059b1:7702de6729e0b62e2a0eae69245cc0d8"
// });

// async function requestTestnetTokens(walletAddress: string) {
//   try {
//     const response = await client.requestTestnetTokens({
//       address: walletAddress,
//       blockchain: 'SOL-DEVNET',
//       usdc: true,
//       native: true
//     });
    
//     console.log('Testnet tokens requested successfully:', response.status);
//     return true;
//   } catch (error) {
//     console.error('Error requesting testnet tokens:', error);
//     return false;
//   }
// }


// async function executeBatchSolanaSolTransfer() {
//   try {



//     // Request testnet tokens for the wallet
//     await requestTestnetTokens(walletAddress);
//     console.log('Waiting for tokens to be credited...');
//     await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    

//   } catch (error) {
//     console.error("Error executing batch transaction:", error);
//   }
// }
