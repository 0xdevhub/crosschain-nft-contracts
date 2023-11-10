import { getContractAddress, getContractFactory } from '@/scripts/utils'
import { Hub__factory } from '@/typechain'

export async function deployHubFixture(accessManagementAddress: string) {
  const Hub = await getContractFactory<Hub__factory>('Hub')

  const hub = await Hub.deploy(accessManagementAddress)
  const hubAddress = await getContractAddress(hub)

  return { hub, hubAddress }
}
