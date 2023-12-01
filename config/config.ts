import { reduce } from 'lodash'
import {
  avalancheFuji,
  optimismGoerli,
  baseGoerli,
  polygonMumbai
} from './chains'
import { Chain } from './types'

export const allowedChains = [
  avalancheFuji,
  optimismGoerli,
  baseGoerli,
  polygonMumbai
]

export const allowedChainsConfig = reduce(
  allowedChains,
  (acc, chain: Chain) => {
    acc[chain.id] = chain

    return acc
  },
  {} as { [key: number]: Chain }
)
