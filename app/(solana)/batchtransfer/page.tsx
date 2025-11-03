"use client"
import { executeSolanaBatchTransfer } from "@/lib/scripts/solanaBatchTransfer";
import { performSolanaSwap } from "@/lib/scripts/swapSolanaTransfer";

export default function Page() {
  // const signature = await exampleBatchTransfer();
   const executeSolana = async () => {
     const signature = await performSolanaSwap();
     console.log(signature);
   }
  return (
    <div>
      <h1>Batch Transaction Example</h1>
      <p>Transaction Signature:</p>
      <button className="bg-white text-black" onClick={() => executeSolana()}>Execute Batch Transfer</button>
    </div>
  );
}
