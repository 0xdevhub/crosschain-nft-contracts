import { getContractAddress, getContractFactory } from '@/scripts/utils'
import { MockBridge__factory } from '@/typechain'

export async function deployMockBridgeFixture() {
  const MockBridge = await getContractFactory<MockBridge__factory>('MockBridge')
  const mockBridge = await MockBridge.deploy()
  const mockBridgeAddress = await getContractAddress(mockBridge)

  return { mockBridge, mockBridgeAddress }
}
