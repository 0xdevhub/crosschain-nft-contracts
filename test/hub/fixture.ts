import { ethers } from 'hardhat'

export async function deployHubFixture(
  registryAddress: string,
  accessManagementAddress: string
) {
  const [owner] = await ethers.getSigners()
  const Hub = await ethers.getContractFactory('Hub')
  const hub = await Hub.deploy(registryAddress, accessManagementAddress)

  const hubAddress = await hub.getAddress()

  return { hub, owner, hubAddress }
}
