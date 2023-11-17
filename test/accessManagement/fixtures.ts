import { AccessManagement__factory } from '@/typechain'

import {
  getSigners,
  getContractAddress,
  getContractFactory
} from '@/scripts/utils'

export async function deployAccessManagementFixture() {
  const [owner] = await getSigners()

  const AccessManagement =
    await getContractFactory<AccessManagement__factory>('AccessManagement')

  const accessManagement = await AccessManagement.deploy(owner.address)

  const accessManagementAddress = await getContractAddress(accessManagement)

  return { accessManagement, owner, accessManagementAddress }
}
