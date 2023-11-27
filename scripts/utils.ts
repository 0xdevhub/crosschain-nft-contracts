import { BaseContract } from 'ethers'
import { ethers } from 'hardhat'

export async function getNetwork() {
  return await ethers.provider.getNetwork()
}

export async function getSigners() {
  return await ethers.getSigners()
}

export async function deployContract<T>(name: string, ...args: T[]) {
  const Contract = await ethers.getContractFactory(name)
  const contract = await Contract.deploy(...args)
  await contract.waitForDeployment()

  return contract
}

export async function getContractAt(name: string, address: string) {
  return await ethers.getContractAt(name, address)
}

export async function getContractAddress(contract: BaseContract) {
  return await contract.getAddress()
}

export async function getContractFactory<T>(name: string): Promise<T> {
  return await (ethers.getContractFactory(name) as T)
}

export const abiCoder = ethers.AbiCoder.defaultAbiCoder()
