import { task } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { RampType } from '@/test/bridge/fixture'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

export type SetChainSettingsParams = {
  bridgeAddress: string
  evmChainId: number
  nonEvmChainId: number
  adapterAddress: string
  rampType: RampType
  isEnabled: boolean
}

task('set-chain-settings', 'set chain settings')
  .addParam('bridgeAddress', 'bridge address')
  .addParam('evmChainId', 'genesis evm chain id')
  .addParam('nonEvmChainId', 'abstracted evm chain id that adapters will use')
  .addParam('adapterAddress', 'adapter address')
  .addParam('rampType', 'ramp type to allow chain id communication')
  .addParam('isEnabled', 'set chain settings is enabled')
  .setAction(
    async (
      {
        bridgeAddress,
        evmChainId,
        nonEvmChainId,
        adapterAddress,
        rampType,
        isEnabled
      }: SetChainSettingsParams,
      hre
    ) => {
      spinner.start()

      console.log(
        `ℹ️ Setting chain settings to bridge ${bridgeAddress} the following chainId: ${evmChainId}`
      )

      const bridgeContract = await hre.ethers.getContractAt(
        'Bridge',
        bridgeAddress
      )

      await bridgeContract.setChainSetting(
        evmChainId,
        nonEvmChainId,
        adapterAddress,
        rampType,
        isEnabled
      )

      spinner.stop()
      console.log(`✅ ChainId ${evmChainId} settings set to bridge.`)
    }
  )
