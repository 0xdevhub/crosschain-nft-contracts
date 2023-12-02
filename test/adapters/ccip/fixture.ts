import { getContractAddress, getContractFactory } from '@/scripts/utils'
import { CCIPAdapter__factory } from '@/typechain'
import { ethers } from 'hardhat'

export async function deployCCIPAdapterFixture(
  bridgeAddress: string,
  accessManagementAddress: string,
  routerAddress: string,
  feeTokenAddress?: string
) {
  const CCIPAdapter =
    await getContractFactory<CCIPAdapter__factory>('CCIPAdapter')

  const ccipAdapter = await CCIPAdapter.deploy(
    bridgeAddress,
    accessManagementAddress,
    routerAddress,
    feeTokenAddress || ethers.ZeroAddress
  )
  const ccipAdapterAddress = await getContractAddress(ccipAdapter)

  return { ccipAdapter, ccipAdapterAddress }
}
