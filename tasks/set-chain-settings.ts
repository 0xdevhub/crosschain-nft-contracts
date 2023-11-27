import { task } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

task('set-chain-settings', 'Set chain settings for adapters').setAction(
  async (_, hre) => {
    spinner.start()

    const chainConfig = allowedChainsConfig[+hre.network.name]
    if (!chainConfig) throw new Error('Chain config not found')

    const accessManagementAddress =
      chainConfig.contracts.accessManagement.address

    console.log(`ℹ️  Setting chain settings...`)
    // todo: set chain settings

    spinner.stop()
    console.log(`✅ Chain settings set: `)
  }
)
