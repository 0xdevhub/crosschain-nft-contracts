import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'

export enum RampType {
  OnRamp,
  OffRamp
}

const spinner: Spinner = new Spinner(cliSpinner.triangle)

export type SetEvmChainIdSettingsParams = {
  bridgeAddress: string
  evmChainId: number
  nonEvmChainId: number
  adapterAddress: string
  targetAdapterAddress: string
  isEnabled: boolean
  gasLimit: bigint
  accountIndex: number
}

task('set-chain-settings', 'set chain settings')
  .addParam('bridgeAddress', 'bridge address')
  .addParam('evmChainId', 'genesis evm chain id')
  .addParam('nonEvmChainId', 'abstracted evm chain id that adapters will use')
  .addParam('adapterAddress', 'adapter address')
  .addParam('targetAdapterAddress', 'target adapter address')
  .addParam('isEnabled', 'set chain settings is enabled')
  .addOptionalParam('gasLimit', 'gas limit', '200000', types.string)
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
      }: SetEvmChainIdSettingsParams,
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

        console.log(
          `ℹ️ Setting chain settings to bridge ${bridgeAddress} in ${chainConfig.id} to the following chainId ${evmChainId} `
        )

        const bridgeContract = await hre.ethers.getContractAt(
          'Bridge',
          bridgeAddress,
          deployer
        )

        console.log('ℹ️ Setting onramp chainSettings')

        const gasLimitValue = gasLimit ? BigInt(gasLimit) : 2000000n

        const tx = await bridgeContract.setEvmChainIdSetting(
          evmChainId,
          nonEvmChainId,
          adapterAddress,
          RampType.OnRamp,
          isEnabled,
          gasLimitValue
        )

        const receipt = await tx.wait()
        const gasUsed = receipt?.gasUsed || 0n

        spinner.stop()

        console.log('ℹ️ Done and gas used: ', gasUsed)

        /**
         *
         */

        spinner.start()
        console.log('ℹ️ Setting offramp chainSettings')

        const tx2 = await bridgeContract.setEvmChainIdSetting(
          evmChainId,
          nonEvmChainId,
          targetAdapterAddress,
          RampType.OffRamp,
          isEnabled,
          gasLimitValue
        )

        await tx2.wait()

        const receipt2 = await tx2.wait()
        const gasUsed2 = receipt2?.gasUsed || 0n

        console.log('ℹ️ Done and gas used: ', gasUsed2)

        /**
         *
         */
        spinner.stop()
        console.log(
          `✅ ChainId ${evmChainId} settings set to bridge in ${chainConfig.id}.`
        )
      } catch (error) {
        spinner.stop()
        console.log(`❌ ChainId ${evmChainId} settings set failed`)
        console.log(error)
      }
    }
  )
