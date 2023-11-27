import { task } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

task('deploy-bridge-contract', 'Deploy bridge contract').setAction(
  async (_, hre) => {
    spinner.start()

    const chainConfig = allowedChainsConfig[+hre.network.name]
    if (!chainConfig) throw new Error('Chain config not found')

    const accessManagementAddress =
      chainConfig.contracts.accessManagement.address

    console.log(`ℹ️  Deploying bridge contract...`)

    const bridgeContract = await hre.ethers.deployContract('Bridge', [
      accessManagementAddress,
      chainConfig.id
    ])

    const bridgeContractAddress = await bridgeContract.getAddress()

    console.log(`✅ Bridge deployed: ${bridgeContractAddress}`)

    spinner.stop()
  }
)
