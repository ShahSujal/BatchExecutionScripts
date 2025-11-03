"use client"
import { executeSolanaBatchTransfer } from "@/lib/scripts/solanaBatchTransfer";
import swapDevnet from "@/lib/scripts/swapSOl";

export default function Page() {
  // const signature = await exampleBatchTransfer();
  const executeSolana = async () => {
    const signature = await swapDevnet();
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
