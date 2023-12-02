import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'
import { ethers } from 'ethers'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

export type DeployBridgeContractTask = {
  adapter: 'CCIPAdapter'
  bridgeAddress: string
  routerAddress: string
  accountIndex: number
  feeTokenAddress: string
}

task('deploy-adapter-contract', 'Deploy adapter contract')
  .addParam('adapter', 'Adapter name')
  .addParam('bridgeAddress', 'Bridge address')
  .addParam('routerAddress', 'Router address')
  .addOptionalParam(
    'feeTokenAddress',
    'Fee token address',
    ethers.ZeroAddress,
    types.string
  )
  .addOptionalParam(
    'accountIndex',
    'Account index to use for deployment',
    0,
    types.int
  )
  .setAction(
    async (
      {
        adapter,
        bridgeAddress,
        routerAddress,
        accountIndex,
        feeTokenAddress
      }: DeployBridgeContractTask,
      hre
    ) => {
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

        /**
         *
         */
        const accessManagementAddress =
          chainConfig.contracts.accessManagement.address

        console.log(`ℹ️  Deploying adapter ${adapter} contract`)

        const adapterContract = await hre.ethers.deployContract(
          adapter,
          [
            bridgeAddress,
            accessManagementAddress,
            routerAddress,
            feeTokenAddress
          ],
          deployer
        )

        const tx = await adapterContract.waitForDeployment()
        const receipt = await tx.deploymentTransaction()?.wait()
        const gasUsed = receipt?.gasUsed || 0n
        console.log('ℹ️ Gas used: ', gasUsed)

        /**
         *
         */

        const adapterContractAddress = await adapterContract.getAddress()

        spinner.stop()
        console.log(
          `✅ Adapter ${adapter} deployed at:`,
          adapterContractAddress
        )
      } catch (error) {
        spinner.stop()
        console.log(`❌ Adapter ${adapter} deploy failed`)
        console.log(error)
      }
    }
  )
