import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    VersionedTransaction,
    TransactionMessage,
} from "@solana/web3.js";
import {
    Raydium,
} from "@raydium-io/raydium-sdk-v2";
import {
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    NATIVE_MINT,
} from "@solana/spl-token";
import bs58 from "bs58";
import BN from "bn.js";

export async function swapAndDistributeDevnet() {
    console.log("🚀 Swap + multi-recipient transfer on devnet");

    // ---- Setup ----
    const rpcUrl = "https://api.devnet.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");

    // Load wallet from base58 private key
    const base58 = 'Cgk44PiSwNmtG7RhCDe5Ay87ASy9V5yb6DULGApoC9dtxL1EjEuCHULoAqyPMMLgMmUnKksScdorKifxt2k6go7'; // example: "3hG..."
    if (!base58) {
        throw new Error("Please set PRIVATE_KEY_BASE58 env variable");
    }
    const secret = bs58.decode(base58);
    const senderWallet = Keypair.fromSecretKey(secret);

    const raydium = await Raydium.load({
        connection,
        owner: senderWallet,
        cluster: "devnet",
    });

    console.log("✅ Raydium initialized");

    // ---- Define tokens ----
    const inputMint = NATIVE_MINT.toBase58(); // SOL or wSOL
    const outputMint = "USDCoctVLVnvTXBEuP9s8hntucdJokbo17RwHuNXemT"; // Example devnet USDC

    // ---- Fetch pool ----
    const poolList = await raydium.api.fetchPoolByMints({
        mint1: inputMint,
        mint2: outputMint,
    });
    if (!poolList?.data?.length) throw new Error("No pool found for these mints");
    const pool = poolList.data.find(p => p.type === "Standard");
    if (!pool) throw new Error("No 'Standard' pool found");

    const poolInfo = await raydium.liquidity.getPoolInfoFromRpc({ poolId: pool.id });

    // ---- Swap parameters ----
    const amountIn = new BN(10_000_000); // 0.01 SOL (if 9 decimals)
    const { amountOut } = raydium.liquidity.computeAmountOut({
        poolInfo: poolInfo.poolInfo,
        amountIn,
        mintIn: inputMint,
        mintOut: outputMint,
        slippage: 0.5, // 0.5% slippage
    });

    console.log("💰 Estimated amountOut:", amountOut.toString());

    // ---- Build swap ----
    const { transaction: swapTx, signers: swapSigners } = await raydium.liquidity.swap({
        poolInfo: poolInfo.poolInfo,
        feePayer: senderWallet.publicKey,
        inputMint,
        amountIn,
        amountOut,
        fixedSide: "in",
    });

    // ---- Prepare transfer to multiple recipients ----
    const recipientAddresses = [
        "7QjDqR3KuTtN2xEJq1t47SdRcoC2ECXCrxHyMujv4Q5H",
        "5ZSRJecVFTyb9XfXhK3EqekmGug2nvCToD4zPLkwoj2r",
    ];

    const amountPerRecipient = amountOut.div(new BN(recipientAddresses.length));

    const transferIxs = [];

    for (const recipientAddress of recipientAddresses) {
        const recipientPubkey = new PublicKey(recipientAddress);
        const usdcMint = new PublicKey(outputMint);

        const sourceTokenAccount = await getAssociatedTokenAddress(
            usdcMint,
            senderWallet.publicKey,
            true,
        );
        const destinationTokenAccount = await getAssociatedTokenAddress(
            usdcMint,
            recipientPubkey,
            true,
        );

        const accountInfo = await connection.getAccountInfo(destinationTokenAccount);

        if (!accountInfo) {
            // Create ATA for recipient if missing
            const createATAIx = createAssociatedTokenAccountInstruction(
                senderWallet.publicKey,
                destinationTokenAccount,
                recipientPubkey,
                usdcMint
            );
            transferIxs.push(createATAIx);
        }

        // Transfer output tokens
        const transferIx = createTransferInstruction(
            sourceTokenAccount,
            destinationTokenAccount,
            senderWallet.publicKey,
            Number(amountPerRecipient),
            [],
            TOKEN_PROGRAM_ID
        );
        transferIxs.push(transferIx);
    }

    // ---- Combine swap + transfers into one batch ----
    let batchTx: Transaction | VersionedTransaction;

    if (swapTx instanceof VersionedTransaction) {
        // ✅ Handle VersionedTransaction
        const originalMsg = swapTx.message;
        const compiled = TransactionMessage.decompile(originalMsg);

        // Append our custom instructions (transfer, ATA creation, etc.)
        compiled.instructions.push(...transferIxs);

        // Recompile back into a new VersionedTransaction
        const newMsg = compiled.compileToV0Message();
        batchTx = new VersionedTransaction(newMsg);
    } else if (swapTx instanceof Transaction) {
        // ✅ Handle legacy Transaction
        batchTx = swapTx;
        for (const ix of transferIxs) {
            batchTx.add(ix);
        }
    } else {
        throw new Error("❌ Unknown transaction type from Raydium swap()");
    }

    // ---- Set payer + blockhash (legacy only) ----
    if (batchTx instanceof Transaction) {
        const { blockhash } = await connection.getLatestBlockhash();
        batchTx.recentBlockhash = blockhash;
        batchTx.feePayer = senderWallet.publicKey;
    }

    // ---- Sign + send ----
    const allSigners = [senderWallet, ...swapSigners];
    if (batchTx instanceof VersionedTransaction) {
        batchTx.sign(allSigners);
    } else {
        batchTx.partialSign(...allSigners);
    }

    const raw = batchTx.serialize();
    const txid = await connection.sendRawTransaction(raw, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
    });

    console.log("📨 Sent batch transaction:", txid);
    await connection.confirmTransaction(txid, "confirmed");
    console.log("✅ Batch transaction confirmed:", txid);

    return txid;
}
