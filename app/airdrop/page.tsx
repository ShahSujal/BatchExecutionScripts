"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { solanaChains, type SolanaChain } from "@/lib/constants/solChains";
import { evmChains, type EvmChain } from "@/lib/constants/evmChain";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Wallet,
  Coins,
  ArrowRight,
  Send,
} from "lucide-react";

// Types
interface Recipient {
  address: string;
  amount: string;
}

interface Chain {
  id: string | number;
  name: string;
  displayName: string;
  symbol: string;
  balance: string;
  logo: string;
  iconUrl?: string;
}

interface Token {
  address: string;
  name: string;
  symbol: string;
  balance: string;
  decimals: number;
}

// // Helper function to transform imported chains to our Chain interface
// const transformSolanaChain = (chain: SolanaChain): Chain => ({
//   id: chain.id,
//   name: chain.name,
//   displayName: chain.displayName,
//   symbol: chain.currency.symbol,
//   balance: "0.0", // Mock balance - replace with actual wallet balance
//   logo: "🌞", // Solana emoji
//   iconUrl: chain.iconUrl
// });

// const transformEvmChain = (chain: any): Chain => ({
//   id: chain.id,
//   name: chain.name || chain.displayName,
//   displayName: chain.displayName || chain.name,
//   symbol: chain.currency?.symbol || chain.symbol || "ETH",
//   balance: "0.0", // Mock balance - replace with actual wallet balance
//   logo: getEvmChainLogo(chain.name || chain.displayName),
//   iconUrl: chain.iconUrl
// });

// Helper function to get EVM chain logos
// const getEvmChainLogo = (name: string): string => {
//   const nameLower = name.toLowerCase();
//   if (nameLower.includes('ethereum')) return '⟠';
//   if (nameLower.includes('polygon')) return '🟣';
//   if (nameLower.includes('bsc') || nameLower.includes('binance')) return '🟡';
//   if (nameLower.includes('arbitrum')) return '🔵';
//   if (nameLower.includes('optimism')) return '🔴';
//   if (nameLower.includes('base')) return '🔷';
//   return '⚡'; // Default for other chains
// };

// // Mock data
// const solanaChains: Chain[] = [
//   {
//     id: "solana-mainnet",
//     name: "Solana Mainnet",
//     symbol: "SOL",
//     balance: "12.5",
//     logo: "🌞",
//   },
//   {
//     id: "solana-devnet",
//     name: "Solana Devnet",
//     symbol: "SOL",
//     balance: "100.0",
//     logo: "🧪",
//   },
// ];

// const evmChains: Chain[] = [
//   {
//     id: "ethereum",
//     name: "Ethereum",
//     symbol: "ETH",
//     balance: "2.5",
//     logo: "⟠",
//   },
//   {
//     id: "polygon",
//     name: "Polygon",
//     symbol: "MATIC",
//     balance: "850.0",
//     logo: "🟣",
//   },
//   { id: "bsc", name: "BSC", symbol: "BNB", balance: "5.2", logo: "🟡" },
//   {
//     id: "arbitrum",
//     name: "Arbitrum",
//     symbol: "ETH",
//     balance: "1.8",
//     logo: "🔵",
//   },
// ];

const mockTokens: Record<string, Token[]> = {
  ethereum: [
    {
      address: "0x...",
      name: "USD Coin",
      symbol: "USDC",
      balance: "1000.0",
      decimals: 6,
    },
    {
      address: "0x...",
      name: "Tether USD",
      symbol: "USDT",
      balance: "500.0",
      decimals: 6,
    },
    {
      address: "0x...",
      name: "Dai Stablecoin",
      symbol: "DAI",
      balance: "250.0",
      decimals: 18,
    },
  ],
  polygon: [
    {
      address: "0x...",
      name: "USD Coin",
      symbol: "USDC",
      balance: "2000.0",
      decimals: 6,
    },
    {
      address: "0x...",
      name: "Wrapped Ether",
      symbol: "WETH",
      balance: "0.5",
      decimals: 18,
    },
  ],
  bsc: [
    {
      address: "0x...",
      name: "Binance USD",
      symbol: "BUSD",
      balance: "750.0",
      decimals: 18,
    },
    {
      address: "0x...",
      name: "PancakeSwap Token",
      symbol: "CAKE",
      balance: "100.0",
      decimals: 18,
    },
  ],
  arbitrum: [
    {
      address: "0x...",
      name: "USD Coin",
      symbol: "USDC",
      balance: "300.0",
      decimals: 6,
    },
  ],
};

export default function AirdropPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<
    "solana" | "evm" | null
  >(null);
  const [transferType, setTransferType] = useState<"native" | "erc20" | null>(
    null
  );
  const [selectedChain, setSelectedChain] = useState<SolanaChain | EvmChain | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: "", amount: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<
    "success" | "failure" | null
  >(null);

  // Transform imported chains
//   const transformedSolanaChains: Chain[] = solanaChains.map(transformSolanaChain);
//   const transformedEvmChains: Chain[] = evmChains.map(transformEvmChain);

  // Dialog states
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);
  const [showChainDialog, setShowChainDialog] = useState(false);
  const [showRecipientsDialog, setShowRecipientsDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const handleNetworkSelect = (network: "solana" | "evm") => {
    setSelectedNetwork(network);
    setShowNetworkDialog(true);
  };

  const handleTransferTypeSelect = (type: "native" | "erc20") => {
    setTransferType(type);
    setShowNetworkDialog(false);
    setShowChainDialog(true);
  };

  const handleChainSelect = (chain: SolanaChain | EvmChain) => {
    setSelectedChain(chain);
    if (transferType === "erc20" && selectedNetwork === "evm") {
      // For ERC20, we need token selection (handled in the same dialog)
      return;
    }
    setShowChainDialog(false);
    setShowRecipientsDialog(true);
  };

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setShowChainDialog(false);
    setShowRecipientsDialog(true);
  };

  const addRecipient = () => {
    setRecipients([...recipients, { address: "", amount: "" }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (
    index: number,
    field: "address" | "amount",
    value: string
  ) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const executeTransfer = async () => {
    setIsLoading(true);
    setShowRecipientsDialog(false);
    setShowStatusDialog(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Simulate random success/failure
    const success = Math.random() > 0.3;
    setTransactionStatus(success ? "success" : "failure");
    setIsLoading(false);
  };

  const resetAll = () => {
    setSelectedNetwork(null);
    setTransferType(null);
    setSelectedChain(null);
    setSelectedToken(null);
    setRecipients([{ address: "", amount: "" }]);
    setTransactionStatus(null);
    setShowNetworkDialog(false);
    setShowChainDialog(false);
    setShowRecipientsDialog(false);
    setShowStatusDialog(false);
  };

  const cardVariants = {
    initial: { scale: 1, y: 0 },
    hover: { scale: 1.05, y: -10 },
    tap: { scale: 0.95 },
  };

  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section with Full-Width Image */}
      <div className="relative w-full">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="relative w-full h-[40vh] overflow-hidden"
        >
          <Image
            src="/solevm.gif"
            alt="Airdrop"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-black/80" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className=" text-center"
      >
        <h1 className="text-2xl md:text-3xl font-thin mb-4 text-white">
          Multi-Chain <span className=" font-light text-gray-300">Airdrop</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300  font-light">
          Execute batch transfers across Solana and EVM networks with precision
          and speed
        </p>
      </motion.div>
      {/* Main Content */}
      <div className="relative bg-black px-6 md:px-12 py-12">
        {/* Network Selection Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* EVM Card */}
            <motion.div
              variants={cardVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="group cursor-pointer"
              onClick={() => handleNetworkSelect("evm")}
            >
              <div className="relative  backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-blue-500/30 transition-all duration-500 overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <Image
                      src="/ethereum.webp"
                      alt="Solana Logo"
                      width={80}
                      height={80}
                      className="w-8 h-12"
                    />
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors duration-300" />
                  </div>

                  <h3 className="text-2xl font-semibold mb-2 text-white">
                    EVM Networks
                  </h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Ethereum ecosystem including Polygon, BSC, Arbitrum and more
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-500 uppercase tracking-wider">
                    <Coins className="w-4 h-4" />
                    <span>ERC20 • Native Tokens</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Solana Card */}
            <motion.div
              variants={cardVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="group cursor-pointer"
              onClick={() => handleNetworkSelect("solana")}
            >
              <div className="relative backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-500 overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <Image
                      src="/solana.svg"
                      alt="Solana Logo"
                      width={80}
                      height={80}
                      className="w-8 h-12"
                    />
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors duration-300" />
                  </div>

                  <h3 className="text-2xl font-semibold mb-2 text-white">
                    Solana
                  </h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    High-performance blockchain with sub-second finality and
                    minimal fees
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-500 uppercase tracking-wider">
                    <Wallet className="w-4 h-4" />
                    <span>SPL Tokens • Native SOL</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Transfer Type Selection Dialog */}
      <Dialog open={showNetworkDialog} onOpenChange={setShowNetworkDialog}>
        <DialogContent className="bg-black/95 border-gray-800 text-white backdrop-blur-xl">
          <motion.div
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
          >
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-light text-center">
                Choose Transfer Type
              </DialogTitle>
              <p className="text-sm text-gray-400 text-center mt-2">
                {selectedNetwork === "solana"
                  ? "Solana Network"
                  : "EVM Networks"}
              </p>
            </DialogHeader>

            <div className="space-y-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => handleTransferTypeSelect("native")}
                  className="w-full h-20 bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-600 transition-all duration-300 p-6"
                  variant="outline"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-800 rounded-lg">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-base">
                          Native Transfer
                        </div>
                        <div className="text-sm text-gray-400">
                          {selectedNetwork === "solana"
                            ? "SOL"
                            : "ETH, MATIC, BNB"}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                  </div>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => handleTransferTypeSelect("erc20")}
                  className="w-full h-20 bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-600 transition-all duration-300 p-6"
                  variant="outline"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-800 rounded-lg">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-base">
                          {selectedNetwork === "solana"
                            ? "SPL Token Transfer"
                            : "ERC20 Transfer"}
                        </div>
                        <div className="text-sm text-gray-400">
                          {selectedNetwork === "solana"
                            ? "USDC, USDT and other SPL tokens"
                            : "USDC, USDT, DAI and more"}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                  </div>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>





      {/* Chain/Token Selection Dialog */}
      <Dialog open={showChainDialog} onOpenChange={setShowChainDialog}>
        <DialogContent className="bg-black/95 border-gray-800 text-white backdrop-blur-xl max-w-md">
          <motion.div
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
          >
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-light text-center">
                {transferType === "erc20" && selectedChain
                  ? "Select Token"
                  : "Select Chain"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {transferType === "erc20" && selectedChain ? (
                // Token selection
                <>
                  <div className="text-sm text-gray-400 mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                    <span className="text-white font-medium">
                      {selectedChain.displayName}
                    </span>
                    <div className="text-xs mt-1">
                      {selectedChain?.currency.symbol}: {"00"}
                    </div>
                  </div>
                  {mockTokens[selectedChain.id]?.map((token, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={() => handleTokenSelect(token)}
                        className="w-full h-16 bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-600 transition-all duration-300 p-4"
                        variant="outline"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="text-left">
                            <div className="font-medium">{token.name}</div>
                            <div className="text-sm text-gray-400">
                              {token.symbol}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{token.balance}</div>
                            <div className="text-sm text-gray-400">
                              {token.symbol}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </>
              ) : (
                // Chain selection
                (selectedNetwork === "solana" ? solanaChains : evmChains).map(
                  (chain, index) => (
                    <motion.div
                      key={chain.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={() => handleChainSelect(chain)}
                        className="w-full h-16 bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-600 transition-all duration-300 p-4"
                        variant="outline"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <Image className="w-12 h-12" src={chain.iconUrl} alt={chain.displayName} width={20} height={20} />
                            <div className="text-left">
                              <div className="font-medium">{chain.displayName}</div>
                              <div className="text-sm text-gray-400">
                                {chain.currency.symbol}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{"0.0"}</div>
                            <div className="text-sm text-gray-400">
                              {chain.currency.symbol}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  )
                )
              )}
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Recipients Dialog */}
      <Dialog
        open={showRecipientsDialog}
        onOpenChange={setShowRecipientsDialog}
      >
        <DialogContent className="bg-black/95 border-gray-800 text-white backdrop-blur-xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <motion.div
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
          >
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-light text-center">
                Add Recipients
              </DialogTitle>
              <div className="text-sm text-gray-400 text-center mt-2 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                {transferType === "erc20" && selectedToken
                  ? `${selectedToken.name} (${selectedToken.symbol}) - Balance: ${selectedToken.balance}`
                  : `${selectedChain?.displayName} (${selectedChain?.currency.symbol}) - Balance: 0.0`}
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {recipients.map((recipient, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-800"
                >
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Recipient address"
                      value={recipient.address}
                      onChange={(e) =>
                        updateRecipient(index, "address", e.target.value)
                      }
                      className="bg-gray-800/50 border-gray-700 focus:border-gray-500 h-11"
                    />
                    <Input
                      placeholder="Amount"
                      type="number"
                      value={recipient.amount}
                      onChange={(e) =>
                        updateRecipient(index, "amount", e.target.value)
                      }
                      className="bg-gray-800/50 border-gray-700 focus:border-gray-500 h-11"
                    />
                  </div>
                  <Button
                    onClick={() => removeRecipient(index)}
                    variant="outline"
                    size="icon"
                    className="bg-gray-800/50 border-gray-700 hover:bg-red-600/20 hover:border-red-500 h-11 w-11"
                    disabled={recipients.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}

              <Button
                onClick={addRecipient}
                variant="outline"
                className="w-full bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 h-12"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Recipient
              </Button>

              <Button
                onClick={executeTransfer}
                className="w-full bg-white text-black hover:bg-gray-200 h-12 font-medium"
                disabled={recipients.some((r) => !r.address || !r.amount)}
              >
                <Send className="w-4 h-4 mr-2" />
                Execute Transfer
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="bg-black/95 border-gray-800 text-white backdrop-blur-xl">
          <motion.div
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
            className="text-center py-8"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mb-6">
                    <Loader2 className="w-16 h-16 mx-auto animate-spin text-white" />
                  </div>
                  <h3 className="text-xl font-light mb-2">
                    Processing Transfer
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Please wait while we execute your batch transfer...
                  </p>
                </motion.div>
              ) : transactionStatus === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mb-6">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                  </div>
                  <h3 className="text-xl font-light mb-2 text-green-400">
                    Transfer Successful
                  </h3>
                  <p className="text-gray-400 text-sm mb-8">
                    Your batch transfer has been completed successfully.
                  </p>
                  <Button
                    onClick={resetAll}
                    className="bg-white text-black hover:bg-gray-200 h-12 px-8 font-medium"
                  >
                    Create New Transfer
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="failure"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mb-6">
                    <XCircle className="w-16 h-16 mx-auto text-red-500" />
                  </div>
                  <h3 className="text-xl font-light mb-2 text-red-400">
                    Transfer Failed
                  </h3>
                  <p className="text-gray-400 text-sm mb-8">
                    There was an error processing your transfer. Please try
                    again.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={resetAll}
                      className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 h-12 font-medium"
                      variant="outline"
                    >
                      Try Again
                    </Button>
                    <Button
                      onClick={resetAll}
                      variant="outline"
                      className="w-full bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 h-12 font-medium"
                    >
                      Start Over
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
