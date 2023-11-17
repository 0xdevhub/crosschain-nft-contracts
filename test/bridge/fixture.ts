import { getContractAddress, getContractFactory } from '@/scripts/utils'
import {
  Bridge__factory,
  MockAdapter__factory,
  MockNFT__factory
} from '@/typechain'

export async function deployMockAdapterFixture() {
  const MockAdapter =
    await getContractFactory<MockAdapter__factory>('MockAdapter')
  const mockAdapter = await MockAdapter.deploy()
  const mockAdapterAddress = await getContractAddress(mockAdapter)

  return { mockAdapter, mockAdapterAddress }
}

export async function deployMockNFTFixture(name = 'MyNFT', symbol = 'MNFT') {
  const MockNFT = await getContractFactory<MockNFT__factory>('MockNFT')
  const mockNFT = await MockNFT.deploy(name, symbol)
  const mockNFTAddress = await getContractAddress(mockNFT)

  return { mockNFT, mockNFTAddress }
}

export async function deployBridgeFixture(accessManagementAddress: string) {
  const Bridge = await getContractFactory<Bridge__factory>('Bridge')
  const bridge = await Bridge.deploy(accessManagementAddress)
  const bridgeAddress = await getContractAddress(bridge)

  return { bridge, bridgeAddress }
}
