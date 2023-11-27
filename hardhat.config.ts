import dotenv from 'dotenv'
dotenv.config()

import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-verify'
import '@nomicfoundation/hardhat-toolbox'
import '@nomiclabs/hardhat-solhint'
import 'tsconfig-paths/register'
import './tasks'

import { allowedChainsConfig } from '@/config/config'
import { reduce } from 'lodash'
import { Chain } from './config/types'
import { NetworksUserConfig } from 'hardhat/types'

const config: HardhatUserConfig = {
  networks:
    process.env.NODE_ENV !== 'development'
      ? reduce(
          Object.values(allowedChainsConfig),
          (acc, chain: Chain) => {
            acc[chain.id] = {
              url: chain.rpcUrls.default.http[0],
              accounts: chain.accounts
            }

            return acc
          },

          {} as NetworksUserConfig
        )
      : {
          localhost: {
            url: 'http://127.0.0.1:8545'
          },
          hardhat: {}
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
      avalancheFujiTestnet: process.env.AVALANCHE_FUJI_API_KEY!,
      optimisticGoerli: process.env.OPTIMISM_GOERLI_API_KEY!
    }
  }
}

export default config
