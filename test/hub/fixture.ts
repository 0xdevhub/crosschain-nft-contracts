import { address } from './../utils/types'
import { ethers } from 'hardhat'

export async function deployHubFixture(address: address) {
  const [owner] = await ethers.getSigners()

  const Hub = await ethers.getContractFactory('Hub')
  const hub = await Hub.deploy(address)

  const hubAddress = (await hub.getAddress()) as address

  return { hub, owner, hubAddress }
}
