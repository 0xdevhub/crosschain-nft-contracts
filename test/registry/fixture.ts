import { ethers } from 'hardhat'
import { address } from './../../types/account'

export const VAULT_V1 = ethers.keccak256(ethers.toUtf8Bytes('VAULT.V1'))

export async function deployRegistryFixture() {
  const [owner] = await ethers.getSigners()

  const Registry = await ethers.getContractFactory('Registry')
  const registry = await Registry.deploy()
  const registryAddress = (await registry.getAddress()) as address

  return { registry, owner, registryAddress }
}
