import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
 
export async function solanaRequestAirdrop(connection: Connection, publicKey: PublicKey, amount: number = 2 * LAMPORTS_PER_SOL) {
  try {
    console.log(`Requesting airdrop of ${amount / LAMPORTS_PER_SOL} SOL for ${publicKey.toString()}`);
    const signature = await connection.requestAirdrop(publicKey, amount);
    const latestBlockHash = await connection.getLatestBlockhash();
    
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature,
    });
    
    console.log(`Airdrop successful! Signature: ${signature}`);
    return signature;
  } catch (error) {
    console.error('Airdrop failed:', error);
    throw error;
  }
}