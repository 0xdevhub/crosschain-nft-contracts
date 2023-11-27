export interface NativeCurrency {
  decimals: number
  name: string
  symbol: string
}

export interface RpcUrls {
  http: string[]
}

export interface BlockExplorer {
  name: string
  url: string
}

export interface Contracts {
  multicall3: {
    address: string
    blockCreated: number
  }
}

export interface Chain {
  id: number
  name: string
  network: string
  accounts: string[]
  nativeCurrency: NativeCurrency
  rpcUrls: {
    [key: string]: RpcUrls
    default: RpcUrls
    public: RpcUrls
  }
  blockExplorers: {
    etherscan: BlockExplorer
    default: BlockExplorer
  }
  contracts: Contracts
  testnet: boolean
}
