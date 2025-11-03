// TypeScript type definitions for EVM chains
export interface EvmCurrency {
  id: string
  symbol: string
  name: string
  address: string
  decimals: number
  supportsBridging: boolean
}

export interface EvmContracts {
  multicall3: string
  multicaller: string
  onlyOwnerMulticaller: string
  relayReceiver: string
  erc20Router: string
  approvalProxy: string
}

export interface EvmProtocolV2 {
  chainId?: string
  [key: string]: any
}

export interface EvmProtocol {
  v2: EvmProtocolV2
}

export interface EvmChain {
  id: number
  name: string
  displayName: string
  httpRpcUrl: string
  wsRpcUrl: string
  explorerUrl: string
  explorerName: string
  depositEnabled: boolean
  tokenSupport: "All" | "Limited" | "None"
  disabled: boolean
  partialDisableLimit: number
  blockProductionLagging: boolean
  currency: EvmCurrency
  withdrawalFee: number
  depositFee: number
  surgeEnabled: boolean
  iconUrl: string
  contracts: EvmContracts
  vmType: "evm"
  baseChainId: number
  solverAddresses: string[]
  tags: string[]
  protocol: EvmProtocol
  featuredTokens?: any[]
  erc20Currencies?: any[]
  solverCurrencies?: any[]
}

export const evmChains: readonly EvmChain[] = [
  {
    id: 421614,
    name: "arbitrum-sepolia",
    displayName: "Arbitrum Sepolia",
    httpRpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    wsRpcUrl: "",
    explorerUrl: "https://sepolia.arbiscan.io",
    explorerName: "Arbitrum Sepolia Explorer",
    depositEnabled: true,
    tokenSupport: "All",
    disabled: false,
    partialDisableLimit: 0,
    blockProductionLagging: false,
    currency: {
      id: "eth",
      symbol: "ETH",
      name: "Ether",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      supportsBridging: true,
    },
    withdrawalFee: 1000,
    depositFee: 0,
    surgeEnabled: false,
    iconUrl: "https://assets.relay.link/icons/421614/light.png",
    contracts: {
      multicall3: "",
      multicaller: "",
      onlyOwnerMulticaller: "",
      relayReceiver: "0x4cec3461dd63f22554b7fa2abba5bbfe9e86ddfd",
      erc20Router: "",
      approvalProxy: "",
    },
    vmType: "evm",
    baseChainId: 11155111,
    solverAddresses: ["0x3e34b27a9bf37d8424e1a58ac7fc4d06914b76b9"],
    tags: [],
    protocol: {
      v2: {},
    },
  },
  {
    id: 80002,
    name: "amoy",
    displayName: "Amoy",
    httpRpcUrl: "https://rpc-amoy.polygon.technology",
    wsRpcUrl: "",
    explorerUrl: "https://www.oklink.com/amoy",
    explorerName: "OkLink",
    depositEnabled: true,
    tokenSupport: "Limited",
    disabled: false,
    partialDisableLimit: 0,
    blockProductionLagging: false,
    currency: {
      id: "matic",
      symbol: "MATIC",
      name: "Matic",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      supportsBridging: false,
    },
    withdrawalFee: 1000,
    depositFee: 0,
    surgeEnabled: false,
    featuredTokens: [],
    erc20Currencies: [],
    solverCurrencies: [],
    iconUrl: "https://assets.relay.link/icons/80002/light.png",
    contracts: {
      multicall3: "",
      multicaller: "",
      onlyOwnerMulticaller: "",
      relayReceiver: "",
      erc20Router: "",
      approvalProxy: "",
    },
    vmType: "evm",
    baseChainId: 11155111,
    solverAddresses: ["0x3e34b27a9bf37d8424e1a58ac7fc4d06914b76b9"],
    tags: [],
    protocol: {
      v2: {},
    },
  },
  {
    id: 84532,
    name: "base-sepolia",
    displayName: "Base Sepolia",
    httpRpcUrl: "https://sepolia.base.org",
    wsRpcUrl: "",
    explorerUrl: "https://sepolia-explorer.base.org",
    explorerName: "Base Sepolia Explorer",
    depositEnabled: true,
    tokenSupport: "All",
    disabled: false,
    partialDisableLimit: 0,
    blockProductionLagging: false,
    currency: {
      id: "eth",
      symbol: "ETH",
      name: "Ether",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      supportsBridging: true,
    },
    withdrawalFee: 3000,
    depositFee: 0,
    surgeEnabled: false,
    iconUrl: "https://assets.relay.link/icons/84532/light.png",
    contracts: {
      multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
      multicaller: "",
      onlyOwnerMulticaller: "",
      relayReceiver: "0x4cec3461dd63f22554b7fa2abba5bbfe9e86ddfd",
      erc20Router: "0xf5042e6ffac5a625d4e7848e0b01373d8eb9e222",
      approvalProxy: "0xbbbfd134e9b44bfb5123898ba36b01de7ab93d98",
    },
    vmType: "evm",
    baseChainId: 11155111,
    solverAddresses: ["0x3e34b27a9bf37d8424e1a58ac7fc4d06914b76b9"],
    tags: [],
    protocol: {
      v2: {},
    },
  },
  {
    id: 11155420,
    name: "op-sepolia",
    displayName: "OP Sepolia",
    httpRpcUrl: "https://sepolia.optimism.io",
    wsRpcUrl: "",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    explorerName: "OP Sepolia Explorer",
    depositEnabled: true,
    tokenSupport: "Limited",
    disabled: false,
    partialDisableLimit: 0,
    blockProductionLagging: false,
    currency: {
      id: "eth",
      symbol: "ETH",
      name: "Ether",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      supportsBridging: true,
    },
    withdrawalFee: 3000,
    depositFee: 0,
    surgeEnabled: false,
    iconUrl: "https://assets.relay.link/icons/11155420/light.png",
    contracts: {
      multicall3: "0xca11bde05977b3631167028862be2a173976ca11",
      multicaller: "",
      onlyOwnerMulticaller: "",
      relayReceiver: "0x4cec3461dd63f22554b7fa2abba5bbfe9e86ddfd",
      erc20Router: "",
      approvalProxy: "",
    },
    vmType: "evm",
    baseChainId: 11155111,
    solverAddresses: ["0x3e34b27a9bf37d8424e1a58ac7fc4d06914b76b9"],
    tags: [],
    protocol: {
      v2: {},
    },
  },
  {
    id: 11155111,
    name: "sepolia",
    displayName: "Sepolia",
    httpRpcUrl: "https://rpc.sepolia.dev",
    wsRpcUrl: "wss://rpc.sepolia.dev",
    explorerUrl: "https://sepolia.etherscan.io",
    explorerName: "Sepolia Testnet Explorer",
    depositEnabled: true,
    tokenSupport: "All",
    disabled: false,
    partialDisableLimit: 0,
    blockProductionLagging: false,
    currency: {
      id: "eth",
      symbol: "ETH",
      name: "Ether",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      supportsBridging: true,
    },
    withdrawalFee: 0,
    depositFee: 0,
    surgeEnabled: false,
    iconUrl: "https://assets.relay.link/icons/11155111/light.png",
    contracts: {
      multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
      multicaller: "",
      onlyOwnerMulticaller: "",
      relayReceiver: "0x4cec3461dd63f22554b7fa2abba5bbfe9e86ddfd",
      erc20Router: "0xa1bea5fe917450041748dbbbe7e9ac57a4bbebab",
      approvalProxy: "0x77a917df7a084b7b3e43517ae28373c2a5492625",
    },
    vmType: "evm",
    baseChainId: 11155111,
    solverAddresses: ["0x3e34b27a9bf37d8424e1a58ac7fc4d06914b76b9"],
    tags: [],
    protocol: {
      v2: {},
    },
  },
] as const;
