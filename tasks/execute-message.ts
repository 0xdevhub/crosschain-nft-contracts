import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'

const spinner: Spinner = new Spinner(cliSpinner.aesthetic)

export type SetChainSettingsParams = {
  adapterAddress: string
  accountIndex: number
}

task('execute-message', 'execute messa manually ')
  .addParam('adapterAddress', 'adapter address')
  .addOptionalParam(
    'accountIndex',
    'Account index to use for deployment',
    0,
    types.int
  )
  .setAction(
    async ({ adapterAddress, accountIndex }: SetChainSettingsParams, hre) => {
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

        console.log(`ℹ️ executing messages manually`)
        const adapter = await hre.ethers.getContractAt(
          'CCIPAdapter',
          adapterAddress,
          deployer
        )

        const tx = await adapter.manuallyExecuteMessages(10)

        const receipt = await tx.wait()
        const gasUsed = receipt?.gasUsed || 0n
        console.log('ℹ️ Done and gas used: ', gasUsed)

        /**
         *
         */
        spinner.stop()
        console.log(`✅ Messages executed`)
      } catch (error) {
        spinner.stop()
        console.log(`❌ Execute messages failed`)
        console.log(error)
      }
    }
  )
