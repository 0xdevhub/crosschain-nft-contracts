import { getContractAddress, getContractFactory } from '@/scripts/utils'
import {
  Bridge__factory,
  MockAdapter__factory,
  MockContractGeneral__factory,
  MockNFT__factory
} from '@/typechain'

export enum RampType {
  OnRamp,
  OffRamp
}

export async function deployMockContractGeneralFixture() {
  const MockContractGeneral =
    await getContractFactory<MockContractGeneral__factory>(
      'MockContractGeneral'
    )
  const mockContractGeneral = await MockContractGeneral.deploy()
  const mockContractGeneralAddress =
    await getContractAddress(mockContractGeneral)

  return { mockContractGeneral, mockContractGeneralAddress }
}

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

export async function deployBridgeFixture(
  accessManagementAddress: string,
  chainId: number = 137
) {
  const Bridge = await getContractFactory<Bridge__factory>('Bridge')
  const bridge = await Bridge.deploy(accessManagementAddress, chainId)
  const bridgeAddress = await getContractAddress(bridge)

  return { bridge, bridgeAddress }
}
