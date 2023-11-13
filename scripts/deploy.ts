import {
  deployContract,
  getContractAddress,
  getContractAt,
  getNetwork,
  getSigners
} from './utils'

import { DEVELOPER_ROLE, DEVELOPER_ROLE_DELAY } from './constants'

async function main() {
  const { chainId } = await getNetwork()
  console.log('chainId ' + chainId)

  const [owner, developer] = await getSigners()
  console.log('owner:' + owner.address)

  // deploy access management contract
  const accessManagement = await deployContract(
    'AccessManagement',
    owner.address
  )
  const accessManagementAddress = await getContractAddress(accessManagement)
  console.log('accessManagementAddress:' + accessManagementAddress)

  // grant role to developer
  const accessManagementContract = await getContractAt(
    'AccessManagement',
    accessManagementAddress
  )

  await accessManagementContract.grantRole(
    DEVELOPER_ROLE,
    developer.address,
    DEVELOPER_ROLE_DELAY
  )

  console.log(
    'developer role granted: ',
    developer.address,
    DEVELOPER_ROLE,
    DEVELOPER_ROLE_DELAY
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
