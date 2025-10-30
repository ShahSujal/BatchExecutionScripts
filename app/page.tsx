"use client"
// import { handleExecute, handleLogin } from "@/lib/scripts";

import { multipleUserErc20 } from "@/lib/scripts/makeBulkTxn";

export default function Page() {
  const handleUserLogin = async () => {
    try {
      console.log("Starting user login...");
      // const loginResult = await handleLogin();
      const transferResult = await multipleUserErc20();
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed: ' + error);
    }
  };

  // const handleBatchTransfer = async () => {
  //   try {
  //     console.log("Starting batch transfer...");
  //     const transferResult = await handleExecute();
     
  //   } catch (error) {
  //     console.error('Batch transfer failed:', error);
  //     alert('Batch transfer failed: ' + error);
  //   }
  // };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Circle User-Controlled Wallets - Batch Transfer</h1>
      
     
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Step 1: Login & Setup</h3>
        <p>This will create a Circle user and wallet for blockchain transactions.</p>
        <button 
          onClick={()=>handleUserLogin()}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            backgroundColor: '#4169E1', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Login & Setup Wallet
        </button>
      </div>
      
      {/* <div style={{ marginBottom: '20px' }}>
        <h3>Step 2: Execute Batch Transfer</h3>
        <p>Transfer 1 USDC to each recipient address using Circle's smart contract capabilities.</p>
        <button 
          onClick={handleExecute}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor:'pointer'
          }}
        >
          Execute Batch Transfer
        </button>
      
      </div>
       */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
        <h3>About This Demo:</h3>
        <ul>
          <li>Creates a Circle user-controlled wallet</li>
          <li>Requests testnet USDC tokens</li>
          <li>Executes batch transfers to multiple recipients</li>
          <li>Uses Solana devnet for testing</li>
        </ul>
        <p><strong>Recipients:</strong></p>
        
      </div>
    </div>
  );
}
