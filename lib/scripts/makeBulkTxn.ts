"use server"
// Import required libraries
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction, 
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  sendAndConfirmTransaction, 
  Keypair,
  TransactionInstruction,
  SystemProgram
} from '@solana/web3.js';
import bs58 from 'bs58';
import * as fs from 'fs';

// Constants - Replace these with your actual values
const PRIVATE_KEY = ""; // Leave empty to generate new wallet, or provide base58-encoded private key
const USDC_MINT_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Devnet USDC mint address

// Function to create a new user (keypair)
async function createUser(): Promise<Keypair> {
  const newUser = Keypair.generate();
  
  // Save the keypair to a file for future use
  const userInfo = {
    publicKey: newUser.publicKey.toBase58(),
    privateKey: bs58.encode(newUser.secretKey)
  };
  
  fs.writeFileSync('user_wallet.json', JSON.stringify(userInfo, null, 2));
  console.log(`Created new user with public key: ${newUser.publicKey.toBase58()}`);
  console.log('User wallet info saved to user_wallet.json');
  
  return newUser;
}

// Function to claim USDC devnet tokens (airdrop SOL and setup USDC account)
async function claimDevnetUSDC(connection: Connection, wallet: Keypair): Promise<void> {
  try {
    // First, airdrop some SOL to the wallet to pay for transactions
    console.log(`Requesting SOL airdrop for ${wallet.publicKey.toBase58()}`);
    const airdropSignature = await connection.requestAirdrop(wallet.publicKey, 1000000000); // 1 SOL
    const signature = await connection.requestAirdrop(wallet.publicKey, 1000000000); // 1 SOL
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature,
    });
    console.log(`Airdropped 1 SOL to ${wallet.publicKey.toBase58()}`);
    
    // Create USDC token account for the user
    const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
    const userTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      wallet.publicKey
    );
    
    // Check if the token account already exists
    const accountInfo = await connection.getAccountInfo(userTokenAccount);
    if (!accountInfo) {
      console.log('Creating USDC token account...');
      const createATAIx = createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        userTokenAccount,
        wallet.publicKey,
        usdcMint
      );
      
      const transaction = new Transaction().add(createATAIx);
      const txSignature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
      console.log(`Created USDC token account: ${userTokenAccount.toBase58()}`);
      console.log(`Transaction signature: ${txSignature}`);
    } else {
      console.log(`USDC token account already exists: ${userTokenAccount.toBase58()}`);
    }
    
    console.log('Ready to receive USDC tokens');
  } catch (error) {
    console.error('Error claiming devnet USDC:', error);
    throw error;
  }
}

// Function to transfer USDC to multiple recipients in one transaction
async function transferUSDCToMultipleRecipients(
  connection: Connection, 
  senderWallet: Keypair, 
  recipientAddresses: string[], 
  amountPerRecipient: number
): Promise<string> {
  try {
    const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
    const sourceTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      senderWallet.publicKey
    );
    
    // Create a transaction
    const transaction = new Transaction();
    
    // Add instructions for each recipient
    for (const recipientAddress of recipientAddresses) {
      const destinationWalletAddress = new PublicKey(recipientAddress);
      const destinationTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        destinationWalletAddress
      );
      
      // Check if destination token account exists
      const accountInfo = await connection.getAccountInfo(destinationTokenAccount);
      if (!accountInfo) {
        // Create the associated token account for the destination
        const createATAIx = createAssociatedTokenAccountInstruction(
          senderWallet.publicKey,
          destinationTokenAccount,
          destinationWalletAddress,
          usdcMint
        );
        transaction.add(createATAIx);
      }
      
      // Add transfer instruction
      const transferIx = createTransferInstruction(
        sourceTokenAccount,
        destinationTokenAccount,
        senderWallet.publicKey,
        amountPerRecipient
      );
      transaction.add(transferIx);
    }
    
    // Send and confirm the transaction
    const txSignature = await sendAndConfirmTransaction(connection, transaction, [senderWallet]);
    
    console.log('Multiple transfers complete!');
    console.log('Transaction signature:', txSignature);
    console.log(`Transferred ${amountPerRecipient / 1000000} USDC to ${recipientAddresses.length} recipients`);
    
    return txSignature;
  } catch (error) {
    console.error('Error transferring USDC to multiple recipients:', error);
    throw error;
  }
}

// Main function to execute all operations
export async function multipleUserErc20() {
  try {
    // Connect to Solana devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Create a sender wallet from the private key
    let senderWallet: Keypair;
    
    // if (!PRIVATE_KEY || PRIVATE_KEY === "") {
    //   // If no private key is provided, generate a new keypair
    //   console.log("No private key provided, generating a new sender wallet...");
    //   senderWallet = Keypair.generate();
    //   console.log(`Generated sender wallet: ${senderWallet.publicKey.toBase58()}`);
    //   console.log(`Private key (save this): ${bs58.encode(senderWallet.secretKey)}`);
      
    //   // Request airdrop for the new sender wallet
    //   console.log("Requesting SOL airdrop for sender wallet...");
    //   const airdropSignature = await connection.requestAirdrop(senderWallet.publicKey, 2000000000); // 2 SOL
    //   const latestBlockHash = await connection.getLatestBlockhash();
    //   await connection.confirmTransaction({
    //     blockhash: latestBlockHash.blockhash,
    //     lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    //     signature: airdropSignature,
    //   });
    //   console.log("Sender wallet funded with 2 SOL");
    // } else {
      // Use the provided private key
      try {
        const privateKey = bs58.decode(PRIVATE_KEY);
        senderWallet = Keypair.fromSecretKey(privateKey);
        console.log(`Using existing sender wallet: ${senderWallet.publicKey.toBase58()}`);
      } catch (error) {
        console.error("Invalid private key format. Expected base58-encoded string.");
        throw new Error("Invalid PRIVATE_KEY format. Please provide a valid base58-encoded private key or set it to empty string to generate a new one.");
      }
    // }
    
    // Create a new user
    const newUser = await createUser();
    
    // Claim USDC devnet tokens for the new user
    // await claimDevnetUSDC(connection, newUser);
    
    // Generate 30 random recipient addresses (in a real scenario, you would have actual addresses)
    // For this example, we'll create 30 new keypairs to simulate different users
    const recipients: string[] = [];
    for (let i = 0; i < 3; i++) {
      const recipientKeypair = Keypair.generate();
      recipients.push(recipientKeypair.publicKey.toBase58());
      
      // In a real scenario, you might want to save these keypairs or their addresses
      console.log(`Generated recipient ${i+1}: ${recipientKeypair.publicKey.toBase58()}`);
    }
    
    // Add our newly created user to the recipients list
    recipients[0] = newUser.publicKey.toBase58();
    
    // Transfer 1 USDC to each recipient (1 USDC = 1,000,000 units)
    const amountPerRecipient = 1000000; // 1 USDC
    const txSignature = await transferUSDCToMultipleRecipients(
      connection,
      senderWallet,
      recipients,
      amountPerRecipient
    );

    console.log(txSignature);
    
    
    console.log('All operations completed successfully!');
    return txSignature;
  } catch (error) {
    console.error('Error in main function:', error);
    throw error;
  }
}

// // Execute the main function
// main()
//   .then((txSignature) => console.log(`Success! Final transaction signature: ${txSignature}`))
//   .catch(error => console.error('Failed:', error));
