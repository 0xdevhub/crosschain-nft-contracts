import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

export type SetChainSettingsParams = {
  adapterAddress: string
  limit: number
  accountIndex: number
}

task('execute-message', 'execute message manually ')
  .addParam('adapterAddress', 'adapter address')
  .addOptionalParam('limit', 'limit', 10, types.int)
  .addOptionalParam(
    'accountIndex',
    'Account index to use for deployment',
    0,
    types.int
  )
  .setAction(
    async (
      { adapterAddress, accountIndex, limit }: SetChainSettingsParams,
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

        console.log(`ℹ️ executing messages manually`)
        const adapter = await hre.ethers.getContractAt(
          'CCIPAdapter',
          adapterAddress,
          deployer
        )

        const bridge = await hre.ethers.getContractFactory('Bridge')

        console.log(bridge.interface.getError('AdapterNotFound')?.selector)

        const tx = await adapter.executeMessages(limit)

        const receipt = await tx.wait()
        const gasUsed = receipt?.gasUsed || 0n
        spinner.stop()

        console.log('ℹ️ Done and gas used: ', gasUsed)

        /**
         *
         */
        console.log(`✅ Messages executed`)
      } catch (error) {
        spinner.stop()
        console.log(`❌ Execute messages failed`)
        console.log(error)
      }
    }
  )
