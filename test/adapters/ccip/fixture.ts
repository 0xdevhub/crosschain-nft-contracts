import { getContractAddress, getContractFactory } from '@/scripts/utils'
import { CCIPAdapter__factory, MockCCIPRouter__factory } from '@/typechain'

export async function deployCCIPRouterMockFixture() {
  const MockCCIPRouter =
    await getContractFactory<MockCCIPRouter__factory>('MockCCIPRouter')

  const mockCCIPRouter = await MockCCIPRouter.deploy()
  const mockCCIPRouterAddress = await getContractAddress(mockCCIPRouter)

  return { mockCCIPRouter, mockCCIPRouterAddress }
}

export async function deployCCIPAdapterFixture(
  bridgeAddress: string,
  accessManagementAddress: string,
  routerAddress: string
) {
  const CCIPAdapter =
    await getContractFactory<CCIPAdapter__factory>('CCIPAdapter')

  const ccipAdapter = await CCIPAdapter.deploy(
    bridgeAddress,
    accessManagementAddress,
    routerAddress
  )
  const ccipAdapterAddress = await getContractAddress(ccipAdapter)

  return { ccipAdapter, ccipAdapterAddress }
}
