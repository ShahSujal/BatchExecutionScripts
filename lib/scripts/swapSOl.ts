import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Signer, Transaction, VersionedTransaction } from "@solana/web3.js";
import {
    Raydium,
} from "@raydium-io/raydium-sdk-v2";
import { NATIVE_MINT } from "@solana/spl-token";
import bs58 from "bs58";
import BN from "bn.js";

export default async function swapDevnet() {

    console.log("Swap devnet test")
    // Setup
    const rpcUrl = "https://api.devnet.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");

    // Load your wallet (for example from secret key)
    const base58 = 'Cgk44PiSwNmtG7RhCDe5Ay87ASy9V5yb6DULGApoC9dtxL1EjEuCHULoAqyPMMLgMmUnKksScdorKifxt2k6go7'; // example: "3hG..."
    if (!base58) {
        throw new Error("Please set PRIVATE_KEY_BASE58 env variable");
    }
    const secret = bs58.decode(base58);            // returns Uint8Array
    const wallet = Keypair.fromSecretKey(secret);

    console.log({ wallet })

    // Initialize Raydium SDK instance configured for devnet
    const raydium = await Raydium.load({
        connection,
        owner: wallet,
        cluster: "devnet",            // specify devnet
        // optionally: apiHost for devnet if different
    });

    console.log("Raydium sdk initalized");

    // Define tokens & pool info
    const inputMint = NATIVE_MINT.toBase58();    // e.g., SOL
    const outputMint = 'USDCoctVLVnvTXBEuP9s8hntucdJokbo17RwHuNXemT'; // e.g., some SPL token deployed on Devnet
    // const recipient = new PublicKey("");

    // Fetch a pool by mints (if available on devnet)
    const poolList = await raydium.api.fetchPoolByMints({
        mint1: inputMint,
        mint2: outputMint,
    });

    if (!poolList) {
        throw new Error("No pool found for these mints on devnet");
    }

    console.log("Found pools: ", poolList);


    const pool = Array.isArray(poolList.data) && poolList.data.length > 0 ? poolList.data[2] : null; // pick first one if available
    if (!pool || pool.type !== "Standard") {
        throw new Error("No valid pool found in the pool list or pool type is not 'Standard'");
    }
    console.log("Using pool:", pool.id);

    // Determine amountIn (in units of token decimals)
    // const amountIn = 1 * (10 ** pool.mintA.decimals); // adjust decimal logic

    const id = pool.id;

    const poolInfo = await raydium.liquidity.getPoolInfoFromRpc({
        poolId: id,
    });

    const amountIn = new BN(10000000);
    // Compute swap quote
    const { amountOut } = raydium.liquidity.computeAmountOut({
        poolInfo: poolInfo.poolInfo,
        amountIn: amountIn,
        mintIn: inputMint,
        mintOut: outputMint,
        slippage: 0.5 // 0.5% slippage tolerance
    });

    console.log("Estimated amountOut:", amountOut.toString());

    // Build transaction
    const { transaction, signers } = await raydium.liquidity.swap({
        poolInfo: poolInfo.poolInfo,
        feePayer: wallet.publicKey,
        inputMint: inputMint,
        amountIn: amountIn,
        amountOut: amountOut,
        fixedSide: "in"
    });

    const allSigners = [wallet, ...(signers || [])].filter(
        (s): s is Keypair => s instanceof Keypair
    );

    // 🔄 Ensure recent blockhash + fee payer for legacy tx
    if (transaction instanceof Transaction) {
        const latestBlockhash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = wallet.publicKey;
    }

    // 🖊️ Sign transaction
    if (transaction instanceof VersionedTransaction) {
        transaction.sign(allSigners);
        console.log("🖊️ Signed VersionedTransaction");
    } else if (transaction instanceof Transaction) {
        transaction.partialSign(...allSigners);
        console.log("🖊️ Signed Legacy Transaction");
    } else {
        throw new Error("❌ Unknown transaction type");
    }

    // 🚀 Send and confirm
    let txid: string;
    try {
        const rawTx = transaction.serialize();
        txid = await connection.sendRawTransaction(rawTx, {
            skipPreflight: false,
            preflightCommitment: "confirmed",
        });

        console.log("📨 Transaction sent:", txid);

        await connection.confirmTransaction(txid, "confirmed");
        console.log("✅ Transaction confirmed:", txid);
    } catch (err) {
        console.error("❌ Transaction failed:", err);
        throw err;
    }

    return txid;
}