import { batchTransferTokens, loginUser } from "../actions/transfer";

export const handleLogin = async () => {
    try {
      console.log("Starting login...");
      const loginResult = await loginUser();
      if (loginResult.success) {
        alert(`Login successful!\nUser ID: ${loginResult.userId}\nWallet ID: ${loginResult.walletId}`);
      } else {
        alert(`Login failed: ${loginResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed: ' + error);
    }
  };

  const handleExecute = async () => {
    try {
      console.log("Starting batch transfer...");
      const challengeId = await batchTransferTokens();
      console.log(`Batch transfer initiated with challenge ID: ${challengeId}`);
      alert(`Batch transfer initiated with challenge ID: ${challengeId}`);
    } catch (error) {
      console.error('Batch transfer failed:', error);
      alert('Batch transfer failed: ' + error);
    }
  };