import { evmAccounts } from './accounts'
import { Chain } from './types'

export const avalancheFuji: Chain = {
  id: 43_113,
  name: 'Avalanche Fuji',
  network: 'avalanche-fuji',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche Fuji',
    symbol: 'AVAX'
  },
  accounts: evmAccounts,
  rpcUrls: {
    protocol: {
      http: [process.env.PUBLIC_NETWORK_43113_HTTP_RPC!]
    },
    default: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] },
    public: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] }
  },
  blockExplorers: {
    etherscan: { name: 'SnowTrace', url: 'https://testnet.snowtrace.dev' },
    default: { name: 'SnowTrace', url: 'https://testnet.snowtrace.dev' }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 7096959
    },
    accessManagement: {
      address: '0x7953C478A5F5d53C263Bd1251BfC4c418d8C5568',
      blockCreated: 0
    }
  },
  testnet: true,
  gasPrice: 25000000000
}

export const optimismGoerli: Chain = {
  id: 420,
  name: 'Optimism Goerli',
  network: 'optimism-goerli',
  nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 },
  accounts: evmAccounts,
  rpcUrls: {
    protocol: {
      http: [process.env.PUBLIC_NETWORK_420_HTTP_RPC!]
    },
    default: {
      http: ['https://goerli.optimism.io']
    },
    public: {
      http: ['https://goerli.optimism.io']
    }
  },
  blockExplorers: {
    etherscan: {
      name: 'Etherscan',
      url: 'https://goerli-optimism.etherscan.io'
    },
    default: {
      name: 'Etherscan',
      url: 'https://goerli-optimism.etherscan.io'
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 49461
    },
    accessManagement: {
      address: '0x483E5D5a59EeB5dB9c2AAC502Da40fab173b8DF2',
      blockCreated: 0
    }
  },
  testnet: true,
  gasPrice: 210000
}

export const baseGoerli: Chain = {
  id: 84531,
  network: 'base-goerli',
  name: 'Base Goerli',
  accounts: evmAccounts,
  nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    protocol: {
      http: [process.env.PUBLIC_NETWORK_84531_HTTP_RPC!]
    },
    default: {
      http: ['https://goerli.base.org']
    },
    public: {
      http: ['https://goerli.base.org']
    }
  },
  blockExplorers: {
    etherscan: {
      name: 'Basescan',
      url: 'https://goerli.basescan.org'
    },
    default: {
      name: 'Basescan',
      url: 'https://goerli.basescan.org'
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 1376988
    },
    accessManagement: {
      address: '0x9eDb3e9d394B924a2FE264C170049795F849479c',
      blockCreated: 0
    }
  },
  testnet: true,
  gasPrice: 210000
}
