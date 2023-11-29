import { task } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
export enum RampType {
  OnRamp,
  OffRamp
}
import { allowedChainsConfig } from '@/config/config'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

export type SetChainSettingsParams = {
  bridgeAddress: string
  evmChainId: number
  nonEvmChainId: number
  adapterAddress: string
  targetAdapterAddress: string
  isEnabled: boolean
}

task('set-chain-settings', 'set chain settings')
  .addParam('bridgeAddress', 'bridge address')
  .addParam('evmChainId', 'genesis evm chain id')
  .addParam('nonEvmChainId', 'abstracted evm chain id that adapters will use')
  .addParam('adapterAddress', 'adapter address')
  .addParam('targetAdapterAddress', 'target adapter address')
  .addParam('isEnabled', 'set chain settings is enabled')
  .setAction(
    async (
      {
        bridgeAddress,
        evmChainId,
        nonEvmChainId,
        targetAdapterAddress,
        adapterAddress,
        isEnabled
      }: SetChainSettingsParams,
      hre
    ) => {
      spinner.start()

      const chainConfig = allowedChainsConfig[+hre.network.name]
      if (!chainConfig) throw new Error('Chain config not found')

      console.log(
        `ℹ️ Setting chain settings to bridge ${bridgeAddress} in ${chainConfig.id} to the following chainId ${evmChainId} `
      )

      const bridgeContract = await hre.ethers.getContractAt(
        'Bridge',
        bridgeAddress
      )

      await bridgeContract.setChainSetting(
        evmChainId,
        nonEvmChainId,
        adapterAddress,
        RampType.OnRamp,
        isEnabled
      )

      await bridgeContract.setChainSetting(
        evmChainId,
        nonEvmChainId,
        targetAdapterAddress,
        RampType.OffRamp,
        isEnabled
      )

      spinner.stop()
      console.log(
        `✅ ChainId ${evmChainId} settings set to bridge in ${chainConfig.id}.`
      )
    }
  )
