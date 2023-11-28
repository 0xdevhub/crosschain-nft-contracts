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
      address: '0x091BEbE42637D6c283f88ceF478Cab8581293f73',
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
      address: '0xd9b59f89A8FEF69d2Dbc028C9f00087432589F72',
      blockCreated: 0
    }
  },
  testnet: true,
  gasPrice: 210000
}
