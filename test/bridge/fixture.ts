import { getContractAddress, getContractFactory } from '@/scripts/utils'
import {
  Bridge__factory,
  MockAdapter__factory,
  MockContractGeneral__factory
} from '@/typechain'

export enum RampType {
  OnRamp,
  OffRamp
}

export async function deployBridgeFixture(
  accessManagementAddress: string,
  chainId: number = 137
) {
  const Bridge = await getContractFactory<Bridge__factory>('Bridge')
  const bridge = await Bridge.deploy(accessManagementAddress, chainId)
  const bridgeAddress = await getContractAddress(bridge)

  return { bridge, bridgeAddress }
}
