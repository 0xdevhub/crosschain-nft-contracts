import dotenv from 'dotenv'
dotenv.config()

import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-verify'
import '@nomicfoundation/hardhat-toolbox'
import '@nomiclabs/hardhat-solhint'
import 'tsconfig-paths/register'
import './tasks'

import { allowedChainsConfig } from '@/config/config'
import { avalancheFuji } from '@/config/chains'

const config: HardhatUserConfig = {
  networks:
    process.env.NODE_ENV !== 'development'
      ? {
          [avalancheFuji.id]: {
            url: allowedChainsConfig[avalancheFuji.id].rpcUrls.default.http[0],
            accounts: allowedChainsConfig[avalancheFuji.id].accounts
          }
        }
      : {
          localhost: {
            url: 'http://127.0.0.1:8545'
          },
          hardhat: {
            // See its defaults
          }
        },
  solidity: {
    version: '0.8.21',
    settings: {
      optimizer: {
        enabled: true,
        runs: 800
      }
    }
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v6'
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY!,
      avalancheFujiTestnet: process.env.AVALANCHE_FUJI_API_KEY!
    }
  }
}

export default config
