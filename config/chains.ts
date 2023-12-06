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
  assets: {
    LINK: {
      address: '0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846',
      decimals: 18
    }
  }
}

export const polygonMumbai: Chain = {
  id: 80_001,
  name: 'Polygon Mumbai',
  network: 'maticmum',
  accounts: evmAccounts,
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: {
    protocol: {
      http: [process.env.PUBLIC_NETWORK_80001_HTTP_RPC!]
    },
    infura: {
      http: ['https://polygon-mumbai.infura.io/v3']
    },
    default: {
      http: ['https://rpc.ankr.com/polygon_mumbai']
    },
    public: {
      http: ['https://rpc.ankr.com/polygon_mumbai']
    }
  },
  blockExplorers: {
    etherscan: {
      name: 'PolygonScan',
      url: 'https://mumbai.polygonscan.com'
    },
    default: {
      name: 'PolygonScan',
      url: 'https://mumbai.polygonscan.com'
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 25770160
    },
    accessManagement: {
      address: '0xBbd6d4dC3BF45fdbc286a01916eb7611b727957c',
      blockCreated: 0
    }
  },
  testnet: true,
  assets: {
    LINK: {
      address: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
      decimals: 18
    }
  }
}
