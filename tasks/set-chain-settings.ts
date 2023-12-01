import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'

export enum RampType {
  OnRamp,
  OffRamp
}

const spinner: Spinner = new Spinner(cliSpinner.triangle)

export type SetChainSettingsParams = {
  bridgeAddress: string
  evmChainId: number
  nonEvmChainId: number
  adapterAddress: string
  targetAdapterAddress: string
  isEnabled: boolean
  gasLimit: number
  accountIndex: number
}

task('set-chain-settings', 'set chain settings')
  .addParam('bridgeAddress', 'bridge address')
  .addParam('evmChainId', 'genesis evm chain id')
  .addParam('nonEvmChainId', 'abstracted evm chain id that adapters will use')
  .addParam('adapterAddress', 'adapter address')
  .addParam('targetAdapterAddress', 'target adapter address')
  .addParam('isEnabled', 'set chain settings is enabled')
  .addParam('gasLimit', 'gas limit')
  .addOptionalParam(
    'accountIndex',
    'Account index to use for deployment',
    0,
    types.int
  )
  .setAction(
    async (
      {
        bridgeAddress,
        evmChainId,
        nonEvmChainId,
        targetAdapterAddress,
        adapterAddress,
        gasLimit,
        isEnabled,
        accountIndex
      }: SetChainSettingsParams,
      hre
    ) => {
      spinner.start()

      const chainConfig = allowedChainsConfig[+hre.network.name]
      if (!chainConfig) throw new Error('Chain config not found')

      console.log(
        `ℹ️ Setting chain settings to bridge ${bridgeAddress} in ${chainConfig.id} to the following chainId ${evmChainId} `
      )

      const provider = new hre.ethers.JsonRpcProvider(
        chainConfig.rpcUrls.default.http[0],
        chainConfig.id
      )

      const deployer = new hre.ethers.Wallet(
        chainConfig.accounts[accountIndex],
        provider
      )

      const bridgeContract = await hre.ethers.getContractAt(
        'Bridge',
        bridgeAddress,
        deployer
      )

      await bridgeContract.waitForDeployment()

      const tx = await bridgeContract.setChainSetting(
        evmChainId,
        nonEvmChainId,
        adapterAddress,
        RampType.OnRamp,
        isEnabled,
        gasLimit
      )
      await tx.wait()

      const tx2 = await bridgeContract.setChainSetting(
        evmChainId,
        nonEvmChainId,
        targetAdapterAddress,
        RampType.OffRamp,
        isEnabled,
        gasLimit
      )

      await tx2.wait()

      spinner.stop()
      console.log(
        `✅ ChainId ${evmChainId} settings set to bridge in ${chainConfig.id}.`
      )
    }
  )
