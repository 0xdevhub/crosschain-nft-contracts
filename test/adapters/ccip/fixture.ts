import { getContractAddress, getContractFactory } from '@/scripts/utils'
import { CCIPAdapter__factory } from '@/typechain'

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
