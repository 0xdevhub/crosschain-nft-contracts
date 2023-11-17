import { getContractAddress, getContractFactory } from '@/scripts/utils'
import { MockBridge__factory, Bridge__factory } from '@/typechain'

export async function deployMockBridgeFixture() {
  const MockBridge = await getContractFactory<MockBridge__factory>('MockBridge')

  const mockBridge = await MockBridge.deploy()
  const mockBridgeAddress = await getContractAddress(mockBridge)

  return { mockBridge, mockBridgeAddress }
}

export async function deployBridgeFixture(
  accessManagementAddress: string,
  adapterAddress: string
) {
  const Bridge = await getContractFactory<Bridge__factory>('Bridge')

  const bridge = await Bridge.deploy(accessManagementAddress, adapterAddress)
  const bridgeAddress = await getContractAddress(bridge)

  return { bridge, bridgeAddress }
}
