import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

export type DeployBridgeContractTask = {
  accountIndex: number
}

task('deploy-bridge-contract', 'Deploy bridge contract')
  .addOptionalParam(
    'accountIndex',
    'Account index to use for deployment',
    0,
    types.int
  )
  .setAction(async ({ accountIndex }: DeployBridgeContractTask, hre) => {
    spinner.start()

    try {
      const chainConfig = allowedChainsConfig[+hre.network.name]
      if (!chainConfig) {
        spinner.stop()
        throw new Error('Chain config not found')
      }

      const provider = new hre.ethers.JsonRpcProvider(
        chainConfig.rpcUrls.default.http[0],
        chainConfig.id
      )

      const deployer = new hre.ethers.Wallet(
        chainConfig.accounts[accountIndex],
        provider
      )

      const accessManagementAddress =
        chainConfig.contracts.accessManagement.address

      console.log(`ℹ️  Deploying bridge contract to chainId ${chainConfig.id}`)

      const bridgeContract = await hre.ethers.deployContract(
        'Bridge',
        [accessManagementAddress, chainConfig.id],
        deployer
      )

      const tx = await bridgeContract.waitForDeployment()

      const receipt = await tx.deploymentTransaction()?.wait()
      const gasUsed = receipt?.gasUsed || 0n

      console.log('ℹ️ Gas used: ', gasUsed)

      const bridgeContractAddress = await bridgeContract.getAddress()

      spinner.stop()
      console.log(`✅ Bridge deployed at:`, bridgeContractAddress)
    } catch (error) {
      spinner.stop()
      console.log(`❌ Bridge deploy failed`)
      console.log(error)
    }
  })
