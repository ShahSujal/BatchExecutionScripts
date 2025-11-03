import { Connection, Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Transaction, VersionedTransaction } from '@solana/web3.js';
import { NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';
import { API_URLS, parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2';
import { solanaRequestAirdrop } from './solanaAirdrop';

interface SwapCompute {
    id: string;
    success: true;
    version: 'V0' | 'V1';
    openTime?: undefined;
    msg: undefined;
    data: {
        swapType: 'BaseIn' | 'BaseOut';
        inputMint: string;
        inputAmount: string;
        outputMint: string;
        outputAmount: string;
        otherAmountThreshold: string;
        slippageBps: number;
        priceImpactPct: number;
        routePlan: {
            poolId: string;
            inputMint: string;
            outputMint: string;
            feeMint: string;
            feeRate: number;
            feeAmount: string;
        }[];
    };
}

export const fetchTokenAccountData = async (connection: Connection, keypair: Keypair) => {
    const solAccountResp = await connection.getAccountInfo(keypair.publicKey)
    const tokenAccountResp = await connection.getTokenAccountsByOwner(keypair.publicKey, { programId: TOKEN_PROGRAM_ID })
    const token2022Req = await connection.getTokenAccountsByOwner(keypair.publicKey, { programId: TOKEN_2022_PROGRAM_ID })
    const tokenAccountData = parseTokenAccountResp({
        owner: keypair.publicKey,
        solAccountResp,
        tokenAccountResp: {
            context: tokenAccountResp.context,
            value: [...tokenAccountResp.value, ...token2022Req.value],
        },
    })
    return tokenAccountData
}

export const performSolanaSwap = async () => {

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    const keypair = {
        "publicKey": {
            "0": 112,
            "1": 212,
            "2": 113,
            "3": 87,
            "4": 110,
            "5": 163,
            "6": 135,
            "7": 45,
            "8": 156,
            "9": 172,
            "10": 138,
            "11": 104,
            "12": 19,
            "13": 38,
            "14": 210,
            "15": 93,
            "16": 144,
            "17": 74,
            "18": 76,
            "19": 38,
            "20": 140,
            "21": 146,
            "22": 201,
            "23": 69,
            "24": 165,
            "25": 127,
            "26": 39,
            "27": 35,
            "28": 167,
            "29": 255,
            "30": 193,
            "31": 253
        },
        "secretKey": {
            "0": 66,
            "1": 114,
            "2": 10,
            "3": 47,
            "4": 85,
            "5": 191,
            "6": 80,
            "7": 157,
            "8": 240,
            "9": 197,
            "10": 49,
            "11": 194,
            "12": 66,
            "13": 220,
            "14": 164,
            "15": 197,
            "16": 140,
            "17": 79,
            "18": 247,
            "19": 155,
            "20": 109,
            "21": 114,
            "22": 254,
            "23": 31,
            "24": 106,
            "25": 1,
            "26": 19,
            "27": 40,
            "28": 204,
            "29": 150,
            "30": 57,
            "31": 2,
            "32": 112,
            "33": 212,
            "34": 113,
            "35": 87,
            "36": 110,
            "37": 163,
            "38": 135,
            "39": 45,
            "40": 156,
            "41": 172,
            "42": 138,
            "43": 104,
            "44": 19,
            "45": 38,
            "46": 210,
            "47": 93,
            "48": 144,
            "49": 74,
            "50": 76,
            "51": 38,
            "52": 140,
            "53": 146,
            "54": 201,
            "55": 69,
            "56": 165,
            "57": 127,
            "58": 39,
            "59": 35,
            "60": 167,
            "61": 255,
            "62": 193,
            "63": 253
        }
    }

// const keypair = Keypair.generate(); // In production, you would use your actual keypair
console.log({ keypair });

// Request airdrop to fund the payer account
// await solanaRequestAirdrop(connection, keypair.publicKey, 2 * LAMPORTS_PER_SOL);

// Check balance after airdrop
const balance = await connection.getBalance(keypair.publicKey);
console.log(`Account balance: ${balance / LAMPORTS_PER_SOL} SOL`);

// Circle client configuration
console.log({ keypair });
console.log("user address ", keypair.publicKey.toString());

const inputMint = NATIVE_MINT.toBase58()
const outputMint = '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' // RAY

/** Swap sol to RAY, just change input/output mint */
// const inputMint = '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' // RAY
// const outputMint = NATIVE_MINT.toBase58()

const amount = 10000
const slippage = 0.5 // in percent, for this example, 0.5 means 0.5%
const txVersion: string = 'V0' // or LEGACY
const isV0Tx = txVersion === 'V0'

const [isInputSol, isOutputSol] = [inputMint === NATIVE_MINT.toBase58(), outputMint === NATIVE_MINT.toBase58()]

const { tokenAccounts } = await fetchTokenAccountData(connection, keypair)
const inputTokenAcc = tokenAccounts.find((a) => a.mint.toBase58() === inputMint)?.publicKey
const outputTokenAcc = tokenAccounts.find((a) => a.mint.toBase58() === outputMint)?.publicKey

if (!inputTokenAcc && !isInputSol) {
    console.error('do not have input token account')
    return
}

if (!inputTokenAcc && !isInputSol) {
    console.error('Input token account not found.');
    return;
}

const { data: feeData } = await axios.get<{
    id: string;
    success: boolean;
    data: { default: { vh: number; h: number; m: number } };
}>(`${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`);

const { data: swapResponse } = await axios.get<SwapCompute>(
    `${API_URLS.SWAP_HOST}/compute/swap-base-out?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippage * 100
    }&txVersion=${txVersion}`
);

console.log({ swapResponse });

const { data: swapTransactions } = await axios.post<{
    id: string;
    version: string;
    success: boolean;
    data: { transaction: string }[];
}>(`${API_URLS.SWAP_HOST}/transaction/swap-base-out`, {
    computeUnitPriceMicroLamports: String(feeData.data.default.h),
    swapResponse,
    txVersion,
    wallet: keypair.publicKey.toBase58(),
    wrapSol: isInputSol,
    unwrapSol: isOutputSol,
    inputAccount: isInputSol ? undefined : inputTokenAcc?.toBase58(),
    outputAccount: isOutputSol ? undefined : outputTokenAcc?.toBase58(),
});

const allTxBuf = swapTransactions.data.map((tx) => Buffer.from(tx.transaction, 'base64'));
const allTransactions = allTxBuf.map((txBuf) =>
    isV0Tx ? VersionedTransaction.deserialize(txBuf) : Transaction.from(txBuf)
);

console.log(`Total ${allTransactions.length} transactions to process.`);

let idx = 0;
if (!isV0Tx) {
    for (const tx of allTransactions) {
        console.log(`Sending transaction ${++idx}...`);
        const transaction = tx as Transaction;
        transaction.sign(keypair);
        const txId = await sendAndConfirmTransaction(connection, transaction, [keypair], { skipPreflight: true });
        console.log(`Transaction ${idx} confirmed, txId: ${txId}`);
    }
} else {
    for (const tx of allTransactions) {
        idx++;
        const transaction = tx as VersionedTransaction;
        transaction.sign([keypair]);
        const txId = await connection.sendTransaction(transaction, { skipPreflight: true });
        const { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash({
            commitment: 'finalized',
        });
        console.log(`Sending transaction ${idx}, txId: ${txId}...`);
        await connection.confirmTransaction(
            {
                blockhash,
                lastValidBlockHeight,
                signature: txId,
            },
            'confirmed'
        );
        console.log(`Transaction ${idx} confirmed.`);
    }
}
};