import { getContractAddress, getContractFactory } from '@/scripts/utils'
import { Bridge__factory } from '@/typechain'

export async function deployBridgeFixture(accessManagementAddress: string) {
  const Bridge = await getContractFactory<Bridge__factory>('Bridge')

  const bridge = await Bridge.deploy(accessManagementAddress)
  const bridgeAddress = await getContractAddress(bridge)

  return { bridge, bridgeAddress }
}
