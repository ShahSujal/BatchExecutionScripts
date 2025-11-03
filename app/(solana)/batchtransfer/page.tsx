"use client"
import { executeSolanaBatchTransfer } from "@/lib/scripts/solanaBatchTransfer";
import swapDevnet from "@/lib/scripts/swapSOl";
import { swapAndDistributeDevnet } from "@/lib/scripts/swapSOlTranfer";

export default function Page() {
  // const signature = await exampleBatchTransfer();
  const executeSolana = async () => {
    // const signature = await swapDevnet();
    const signature = await swapAndDistributeDevnet();
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
