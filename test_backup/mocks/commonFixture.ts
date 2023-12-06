import { getContractAddress, getContractFactory } from '@/scripts/utils'
import { MockContractGeneral__factory } from '@/typechain'

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
