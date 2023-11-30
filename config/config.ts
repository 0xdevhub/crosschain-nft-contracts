import { reduce } from 'lodash'
import { avalancheFuji, optimismGoerli, baseGoerli } from './chains'
import { Chain } from './types'

export const allowedChains = [avalancheFuji, optimismGoerli, baseGoerli]

export const allowedChainsConfig = reduce(
  allowedChains,
  (acc, chain: Chain) => {
    acc[chain.id] = chain

    return acc
  },
  {} as { [key: number]: Chain }
)
