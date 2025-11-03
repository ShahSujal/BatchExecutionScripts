// TypeScript type definitions for Solana chains
export interface SolanaCurrency {
  id: string
  symbol: string
  name: string
  address: string
  decimals: number
  supportsBridging: boolean
}

export interface SolanaContracts {
  multicall3: string
  multicaller: string
  onlyOwnerMulticaller: string
  relayReceiver: string
  erc20Router: string
  approvalProxy: string
}

export interface SolanaProtocolV2 {
  chainId?: string
  depository?: string
}

export interface SolanaProtocol {
  v2: SolanaProtocolV2
}

export interface SolanaChain {
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
  currency: SolanaCurrency
  withdrawalFee: number
  depositFee: number
  surgeEnabled: boolean
  iconUrl: string
  contracts: SolanaContracts
  vmType: "svm"
  baseChainId: number
  solverAddresses: string[]
  tags: string[]
  protocol: SolanaProtocol
}

export const solanaChains: readonly SolanaChain[] = [
  {
    id: 1936682084,
    name: "solana-devnet",
    displayName: "Solana Devnet",
    httpRpcUrl: "https://api.devnet.solana.com",
    wsRpcUrl: "",
    explorerUrl: "https://solscan.io/?cluster=devnet",
    explorerName: "SolScan",
    depositEnabled: true,
    tokenSupport: "Limited",
    disabled: false,
    partialDisableLimit: 0,
    blockProductionLagging: false,
    currency: {
      id: "sol",
      symbol: "SOL",
      name: "Solana",
      address: "11111111111111111111111111111111",
      decimals: 9,
      supportsBridging: true,
    },
    withdrawalFee: 1000,
    depositFee: 0,
    surgeEnabled: false,
    iconUrl: "https://assets.relay.link/icons/1936682084/light.png",
    contracts: {
      multicall3: "",
      multicaller: "",
      onlyOwnerMulticaller: "",
      relayReceiver: "",
      erc20Router: "",
      approvalProxy: "",
    },
    vmType: "svm",
    baseChainId: 11155111,
    solverAddresses: ["12BJVNe9rfSGEg3dAcGL8F523jxpRSB7iQ8MkeoyberL"],
    tags: [],
    protocol: {
      v2: {},
    },
  },
  {
    id: 792703809,
    name: "solana",
    displayName: "Solana",
    httpRpcUrl: "https://api.mainnet-beta.solana.com",
    wsRpcUrl: "",
    explorerUrl: "https://solscan.io",
    explorerName: "SolScan",
    depositEnabled: true,
    tokenSupport: "All",
    disabled: false,
    partialDisableLimit: 0,
    blockProductionLagging: false,
    currency: {
      id: "sol",
      symbol: "SOL",
      name: "Solana",
      address: "11111111111111111111111111111111",
      decimals: 9,
      supportsBridging: true,
    },
    withdrawalFee: 25,
    depositFee: 0,
    surgeEnabled: false,
    iconUrl: "https://assets.relay.link/icons/792703809/light.png",
    contracts: {
      multicall3: "",
      multicaller: "",
      onlyOwnerMulticaller: "",
      relayReceiver: "",
      erc20Router: "",
      approvalProxy: "",
    },
    vmType: "svm",
    baseChainId: 1,
    solverAddresses: ["F7p3dFrjRTbtRp8FRF6qHLomXbKRBzpvBLjtQcfcgmNe"],
    tags: [],
    protocol: {
      v2: {
        chainId: "solana",
        depository: "99vQwtBwYtrqqD9YSXbdum3KBdxPAVxYTaQ3cfnJSrN2",
      },
    },
  },
] as const;
