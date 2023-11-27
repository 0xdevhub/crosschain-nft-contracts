export interface NativeCurrency {
  decimals: number
  name: string
  symbol: string
}

export interface Chain {
  id: number
  name: string
  network: string
  accounts: string[]
  nativeCurrency: NativeCurrency
  rpcUrls: {
    [key: string]: {
      http: string[]
    }
  }
  blockExplorers: {
    [key: string]: {
      name: string
      url: string
    }
  }
  contracts: {
    [key: string]: {
      address: string
      blockCreated: number
    }
  }
  testnet: boolean
}
