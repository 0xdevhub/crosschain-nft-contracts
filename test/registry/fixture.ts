import { ethers } from 'hardhat'
import { address } from '@/types/account'

export const VAULT_V1 = ethers.keccak256(ethers.toUtf8Bytes('VAULT.V1'))

export async function deployRegistryFixture(accessManagementAddress: address) {
  const [owner, developer] = await ethers.getSigners()

  const Registry = await ethers.getContractFactory('Registry')
  const registry = await Registry.deploy(accessManagementAddress)
  const registryAddress = await registry.getAddress()

  return { registry, owner, developer, registryAddress }
}
