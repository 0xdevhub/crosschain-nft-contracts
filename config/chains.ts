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
  crosschain: {
    gasRequiredDeploy: 1206898n,
    gasRequiredToMint: 68282n
  },
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
  crosschain: {
    gasRequiredDeploy: 1207276n,
    gasRequiredToMint: 68282n
  },
  assets: {
    LINK: {
      address: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
      decimals: 18
    }
  }
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
  crosschain: {
    gasRequiredDeploy: 1206898n,
    gasRequiredToMint: 68282n
  },
  assets: {
    LINK: {
      address: '0xdc2CC710e42857672E7907CF474a69B63B93089f',
      decimals: 18
    }
  }
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
  crosschain: {
    gasRequiredDeploy: 1206898n,
    gasRequiredToMint: 68282n
  },
  assets: {
    LINK: {
      address: '0x6D0F8D488B669aa9BA2D0f0b7B75a88bf5051CD3',
      decimals: 18
    }
  }
}
