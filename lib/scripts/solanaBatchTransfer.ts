
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  sendAndConfirmTransaction, 
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { solanaRequestAirdrop } from './solanaAirdrop';

/**
* Execute multiple transactions in a batch with a single signature using a smart account
* @param transactions - Array of transaction instructions to be executed
* @param payer - The account that will pay for the transactions
* @param connection - Solana connection object
* @param clientUrl - Circle client URL
* @param clientKey - Circle client API key
* @returns Transaction signature
*/
 async function executeBatchTransactions(
  transactions: TransactionInstruction[],
  payer: Keypair,
  connection: Connection,
  clientUrl: string,
  clientKey: string
): Promise<string> {
  try {
    // Create a new transaction object
    const batchTransaction = new Transaction();
    // Add all transaction instructions to the batch
    transactions.forEach(instruction => {
      batchTransaction.add(instruction);
    });
    // Set the fee payer for the transaction
    batchTransaction.feePayer = payer.publicKey;
    // Get a recent blockhash to include in the transaction
    const { blockhash } = await connection.getLatestBlockhash();
    batchTransaction.recentBlockhash = blockhash;
    // Sign the transaction with the payer's keypair
    batchTransaction.sign(payer);
    // Send and confirm the transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      batchTransaction,
      [payer],
      {
        commitment: 'confirmed',
        skipPreflight: false,
      }
    );
    console.log('Batch transaction executed successfully');
    console.log('Transaction signature:', signature);
    return signature;
  } catch (error) {
    console.error('Error executing batch transaction:', error);
    // If it's a SendTransactionError, get more detailed logs
    if (error && typeof error === 'object' && 'getLogs' in error) {
      try {
        const logs = await (error as any).getLogs();
        console.error('Transaction logs:', logs);
      } catch (logError) {
        console.error('Failed to get transaction logs:', logError);
      }
    }
    throw error;
  }
}


export async function executeSolanaBatchTransfer() {
  // Setup connection and account
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const payer = Keypair.generate(); // In production, you would use your actual keypair
  
  // Request airdrop to fund the payer account
  await solanaRequestAirdrop(connection, payer.publicKey, 2 * LAMPORTS_PER_SOL);
  
  // Check balance after airdrop
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Account balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  // Circle client configuration
  console.log({payer});
  console.log("user address ", payer.publicKey.toString());
 
  const clientKey = process.env.CIRCLE_API_KEY!
  const clientUrl = 'https://modular-sdk.circle.com/v1/rpc/w3s/buidl';
  // Create multiple transfer instructions
  const recipient1 = new PublicKey('8qqRHMtLKHaLtQcteWjh8wtkK9BkrMUC3cevbi4tGbMm');
  console.log({recipient1, recipient1Address: recipient1.toString()});
  
  const recipient2 = new PublicKey('5egm9EaaUfF5agEqT3PtBN7eYLU1C9B1hfLeohBbuJ83');
  console.log({recipient2, recipient2Address: recipient2.toString()});

  const instructions = [
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: recipient1,
      lamports: 0.1 * LAMPORTS_PER_SOL,
    }),
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: recipient2,
      lamports: 0.2 * LAMPORTS_PER_SOL,
    }),
  ];

  console.log({instructions});
  
  // Execute the batch transaction
  try {
    const signature = await executeBatchTransactions(
      instructions,
      payer,
      connection,
      clientUrl,
      clientKey
    );
    console.log(`Batch transaction completed with signature: ${signature}`);
    return signature;
  } catch (error) {
    console.error('Failed to execute batch transaction:', error);
    throw error;
  }
}
