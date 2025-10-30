"use client"
import { executeSolanaBatchTransfer } from "@/lib/scripts/solanaBatchTransfer";

export default function Page() {
  // const signature = await exampleBatchTransfer();
   const executeSolana = async () => {
     const signature = await executeSolanaBatchTransfer();
     console.log(signature);
   }
  return (
    <div>
      <h1>Batch Transaction Example</h1>
      <p>Transaction Signature:</p>
      <button onClick={() => executeSolana()}>Execute Batch Transfer</button>
    </div>
  );
}
