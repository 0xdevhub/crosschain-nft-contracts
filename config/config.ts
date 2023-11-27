import { reduce } from 'lodash'
import { avalancheFuji } from './chains'
import { Chain } from './types'

export const allowedChains = [avalancheFuji]

export const allowedChainsConfig = reduce(
  allowedChains,
  (acc, chain: Chain) => {
    acc[chain.id] = chain

    return acc
  },
  {} as { [key: number]: Chain }
)
