import { ethers } from 'hardhat'

export const ADMIN_ROLE = 0n
export const DEVELOPER_ROLE = 1n

export async function deployAccessManagementFixture() {
  const [owner] = await ethers.getSigners()

  const AccessManagement = await ethers.getContractFactory('AccessManagement')
  const accessManagement = await AccessManagement.deploy(owner.address)

  const accessManagementAddress = await accessManagement.getAddress()

  return { accessManagement, owner, accessManagementAddress }
}
