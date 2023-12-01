import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

export enum AvailableAdapters {
  CCIPAdapter = 'CCIPAdapter'
}

export type DeployBridgeContractTask = {
  adapter: AvailableAdapters
  bridgeAddress: string
  routerAddress: string
  accountIndex: number
}

task('deploy-adapter-contract', 'Deploy adapter contract')
  .addParam('adapter', 'Adapter name')
  .addParam('bridgeAddress', 'Bridge address')
  .addParam('routerAddress', 'Router address')
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
        accountIndex
      }: DeployBridgeContractTask,
      hre
    ) => {
      spinner.start()

      const chainConfig = allowedChainsConfig[+hre.network.name]
      if (!chainConfig) throw new Error('Chain config not found')

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

      console.log(`ℹ️  Deploying adapter contract: ${adapter}`)

      const ccipAdapter = await hre.ethers.deployContract(
        adapter,
        [bridgeAddress, accessManagementAddress, routerAddress],
        deployer
      )

      await ccipAdapter.waitForDeployment()

      const ccipAdapterAddress = await ccipAdapter.getAddress()

      spinner.stop()
      console.log(`✅ CCIPAdapter deployed: ${ccipAdapterAddress}`)
    }
  )
