import { task } from 'hardhat/config'
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
}

task('deploy-adapter-contract', 'Deploy adapter contract')
  .addParam('adapter', 'Adapter name')
  .addParam('bridgeAddress', 'Bridge address')
  .addParam('routerAddress', 'Router address')
  .setAction(
    async (
      { adapter, bridgeAddress, routerAddress }: DeployBridgeContractTask,
      hre
    ) => {
      spinner.start()

      const chainConfig = allowedChainsConfig[+hre.network.name]
      if (!chainConfig) throw new Error('Chain config not found')

      const accessManagementAddress =
        chainConfig.contracts.accessManagement.address

      console.log(`ℹ️  Deploying adapter contract: ${adapter}`)

      const ccipAdapter = await hre.ethers.deployContract(adapter, [
        accessManagementAddress,
        bridgeAddress,
        routerAddress
      ])

      const ccipAdapterAddress = await ccipAdapter.getAddress()

      console.log(`✅ CCIPAdapter deployed: ${ccipAdapterAddress}`)

      spinner.stop()
    }
  )
