import { ethers } from 'hardhat'

export async function deployAccessManagementFixture() {
  const [owner] = await ethers.getSigners()

  const AccessManagement = await ethers.getContractFactory('AccessManagement')
  const accessManagement = await AccessManagement.deploy(owner.address)

  const accessManagementAddress = await accessManagement.getAddress()

  return { accessManagement, owner, accessManagementAddress }
}
