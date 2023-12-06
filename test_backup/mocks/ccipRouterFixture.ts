import { getContractAddress, getContractFactory } from '@/scripts/utils'
import { MockCCIPRouter__factory } from '@/typechain'

export async function deployMockCCIPRouterFixture() {
  const MockCCIPRouter =
    await getContractFactory<MockCCIPRouter__factory>('MockCCIPRouter')

  const mockCCIPRouter = await MockCCIPRouter.deploy()
  const mockCCIPRouterAddress = await getContractAddress(mockCCIPRouter)

  return { mockCCIPRouter, mockCCIPRouterAddress }
}
