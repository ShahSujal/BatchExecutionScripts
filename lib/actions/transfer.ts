"use server"
import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets';
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  sendAndConfirmTransaction, 
  Keypair 
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction, 
  createTransferInstruction 
} from '@solana/spl-token';
import * as bs58 from 'bs58';


// Initialize Circle client
const client = initiateUserControlledWalletsClient({
  apiKey: "TEST8"
});

// User and wallet information
let userToken = ""; // Will be set after authentication
let walletId = ""; // Will be set after wallet creation
const userId = "user-" + Math.random().toString(36).substring(2, 15); // Generate unique user ID

// Solana connection
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// USDC token mint address on Solana devnet
const usdcMintAddress = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// Amount to transfer to each recipient (in smallest units, USDC has 6 decimals)
const transferAmount = 1000000; // 1 USDC

// Define 5 recipient addresses (replace with actual addresses)
const recipientAddresses = [
  '5egm9EaaUfF5agEqT3PtBN7eYLU1C9B1hfLeohBbuJ83',
  'CmHhGmNLW1QSqfnUY4UhFPum9S1wcGdAuU2vSjffWuB6',
].map(address => new PublicKey(address));

/**
 * Create user and get authentication token
 */
export async function createUserAndAuthenticate() {
  try {
    console.log('Creating user...');
    
    // Create user
    const userResponse = await client.createUser({
      userId: userId
    });
    console.log('User created successfully', userResponse.data);
    
    // For now, we'll use a simple approach to get the user token
    // In a real application, you would implement the full PIN/OAuth flow
    
    // Try to get a session token (this might vary based on Circle SDK version)
    try {
     const tokenResponse = await client.createUserToken({
      userId: userId
    });
    console.log('Token response:', tokenResponse.data);
        console.log('Token response:', tokenResponse.data);
      if (tokenResponse.data?.userToken) {
        return tokenResponse.data.userToken;
      }
    } catch (tokenError) {
        console.log(tokenError);
        
      console.log('Token method not available, using fallback');
    }
    
    // Fallback: use a constructed token for testing
    return `user_token_${userId}_${Date.now()}`;
    
  } catch (error) {
    console.error('User creation error:', error);
    // Use fallback token for testing
    return `fallback_token_${userId}`;
  }
}

/**
 * Create wallet for the authenticated user
 */
async function createUserWallet(userToken: string) {
  try {
    console.log('Creating wallet...');
    const response = await client.createWallet({
      userToken: userToken,
      blockchains: ['SOL-DEVNET']
    });
    
    console.log('Wallet creation response:', response.data);
    
    // The response structure might vary, let's handle different cases
    if (response.data) {
      return response.data;
    } else {
      throw new Error('No wallet data in response');
    }
  } catch (error) {
    console.error('Wallet creation error:', error);
    throw error;
  }
}

/**
 * Complete login process
 */
export async function loginUser() {
  try {
    console.log('Starting login process...');
    
    // Step 1: Create user and get token
    const authUserToken = await createUserAndAuthenticate();
    console.log('Authentication token obtained');
    
    // Step 2: Create wallet
    const tokenStr = authUserToken
    const walletData = await createUserWallet(tokenStr);
    console.log('Wallet created');
    
    // Set global variables
    userToken = tokenStr;
    
    // Handle wallet ID (use fallback since Circle SDK response structure varies)
    walletId = walletData.challengeId; // Using known working wallet ID
    console.log('Using configured wallet ID');
    
    console.log('Login completed successfully');
    console.log('User Token:', userToken);
    console.log('Wallet ID:', walletId);
    
    return {
      success: true,
      userToken: userToken,
      walletId: walletId,
      userId: userId
    };
  } catch (error) {
    console.error('Login failed:', error);
    
    // Use fallback values for testing
    userToken = `test_token_${Date.now()}`;
    walletId = "Tq2lzQID1PclJOxdzNAp-4gv8fo";
    
    return {
      success: false,
      userToken: userToken,
      walletId: walletId,
      userId: userId,
      error: error
    };
  }
}

async function requestTestnetTokens(walletAddress: string) {
  try {
    const response = await client.requestTestnetTokens({
      address: walletAddress,
      blockchain: 'SOL-DEVNET',
      usdc: true,
      native: true
    });
    
    console.log('Testnet tokens requested successfully:', response.status);
    return true;
  } catch (error) {
    console.error('Error requesting testnet tokens:', error);
    return false;
  }
}

export async function batchTransferTokens() {
  try {
    // First, ensure user is logged in
    if (!userToken || !walletId) {
      console.log('User not logged in, initiating login...');
      const loginResult = await loginUser();
      if (!loginResult.success) {
        throw new Error('Login failed: ' + loginResult.error);
      }
    }
    
    // Get wallet information to obtain the wallet address
    const walletResponse = await client.getWallet({ id: walletId, userToken });
    if (!walletResponse.data) {
      throw new Error('Failed to get wallet information');
    }
    
    const walletAddress = walletResponse.data.wallet.address;
    if (!walletAddress) {
        throw new Error('Wallet address is missing in the response');
    }
    console.log(`Using wallet address: ${walletAddress}`);
    
    // Request testnet tokens for the wallet
    await requestTestnetTokens(walletAddress);
    console.log('Waiting for tokens to be credited...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    // Get the source token account
    const sourceTokenAccount = await getAssociatedTokenAddress(
      usdcMintAddress,
      new PublicKey(walletAddress)
    );
    
    // Create a new transaction
    const transaction = new Transaction();
    
    // For each recipient, add instructions to create token account if needed and transfer tokens
    for (const recipientAddress of recipientAddresses) {
      // Get the destination token account
      const destinationTokenAccount = await getAssociatedTokenAddress(
        usdcMintAddress,
        recipientAddress
      );
      
      // Check if the destination token account exists
      const accountInfo = await connection.getAccountInfo(destinationTokenAccount);
      
      // If the account doesn't exist, add instruction to create it
      if (!accountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            new PublicKey(walletAddress),
            destinationTokenAccount,
            recipientAddress,
            usdcMintAddress
          )
        );
      }
      
      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          sourceTokenAccount,
          destinationTokenAccount,
          new PublicKey(walletAddress),
          transferAmount
        )
      );
    }
    
    // Serialize the transaction to get the raw transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64');
    
    // Sign the transaction using Circle's API
    const signResponse = await client.signTransaction({
      userToken,
      walletId,
      rawTransaction: serializedTransaction,
      memo: 'Batch transfer USDC to 5 recipients'
    });
    
    if (!signResponse.data || !signResponse.data.challengeId) {
      throw new Error('Failed to initiate transaction signing');
    }
    
    const challengeId = signResponse.data.challengeId;
    console.log(`Challenge ID for signing: ${challengeId}`);
    console.log('Please complete the challenge to sign the transaction');
    
    // In a real application, you would implement a challenge flow here
    // For this example, we'll just print instructions
    console.log('To complete the transaction:');
    console.log('1. Implement the challenge flow to get the signed transaction');
    console.log('2. Once signed, broadcast the transaction to the Solana network');
    console.log('3. The transaction will transfer 1 USDC to each of the 5 recipients');
    
    return challengeId;
  } catch (error) {
    console.error('Error in batch transfer:', error);
    throw error;
  }
}



// curl -X GET "https://api.testnets.relay.link/chains"