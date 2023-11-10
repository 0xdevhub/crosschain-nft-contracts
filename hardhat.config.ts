import dotenv from 'dotenv'
dotenv.config({
  path: '.env.' + process.env.NODE_ENV
})

import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomiclabs/hardhat-solhint'
import 'tsconfig-paths/register'
import { networks as networksConfig } from '@/config/networks'

const networks = {}
if (process.env.NODE_env === 'production') {
  Object.assign(networks, networksConfig)
}

const config: HardhatUserConfig = {
  networks,
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
  }
}

export default config
