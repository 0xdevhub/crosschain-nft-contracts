import { BaseContract } from 'ethers'
import { ethers } from 'hardhat'

async function deployContract(
  name: string,
  ...args: unknown[]
): Promise<BaseContract> {
  const Contract = await ethers.getContractFactory(name)
  const contract = await Contract.deploy(...args)
  await contract.waitForDeployment()

  return contract
}

async function main() {
  const { chainId } = await ethers.provider.getNetwork()
  console.log('chainId ' + chainId)

  const [owner] = await ethers.getSigners()
  console.log('owner:' + owner.address)

  const accessManagementContract = await deployContract(
    'AccessManagement',
    owner.address
  )
  const accessManagementAddress = await accessManagementContract.getAddress()
  console.log('accessManagementAddress:' + accessManagementAddress)

  const hubContract = await deployContract('Hub', accessManagementAddress)
  const hubAddress = await hubContract.getAddress()
  console.log('hubAddress:' + hubAddress)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
