import { task } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import {
  ADAPTER_ROLE,
  ADAPTER_ROLE_DELAY,
  BRIDGE_ROLE,
  BRIDGE_ROLE_DELAY,
  ROUTER_ROLE,
  ROUTER_ROLE_DELAY
} from '@/scripts/constants'

const spinner: Spinner = new Spinner(cliSpinner.triangle)
import { allowedChainsConfig } from '@/config/config'

export type SetupBridgeAdapterTask = {
  bridgeAddress: string
  adapterAddress: string
  adapterRouterAddress: string
  adapterBytes4Signature: string
  adapterContractName: string
}

task('setup-bridge-adapter', 'setting up bridge and adapter')
  .addParam('bridgeAddress', 'bridge address')
  .addParam('adapterAddress', 'adapter address')
  .addParam('adapterRouterAddress', 'adapter router address')
  .addParam('adapterBytes4Signature', 'adapter bytes4 signature')
  .addParam('adapterContractName', 'adapter contract name')
  .setAction(
    async (
      {
        bridgeAddress,
        adapterAddress,
        adapterRouterAddress,
        adapterBytes4Signature,
        adapterContractName
      }: SetupBridgeAdapterTask,
      hre
    ) => {
      spinner.start()

      const chainConfig = allowedChainsConfig[+hre.network.name]
      if (!chainConfig) throw new Error('Chain config not found')

      const accessManagementAddress =
        chainConfig.contracts.accessManagement.address

      console.log(`ℹ️ Grating roles to bridge, adapter and router`)

      const accessManagementContract = await hre.ethers.getContractAt(
        'AccessManagement',
        accessManagementAddress
      )

      // grant role (receive message)
      await accessManagementContract.grantRole(
        ROUTER_ROLE,
        adapterRouterAddress,
        ROUTER_ROLE_DELAY
      )

      await accessManagementContract.grantRole(
        ADAPTER_ROLE,
        adapterAddress,
        ADAPTER_ROLE_DELAY
      )

      await accessManagementContract.grantRole(
        BRIDGE_ROLE,
        bridgeAddress,
        BRIDGE_ROLE_DELAY
      )

      // grant function role (send message)
      // bridge -> adapter
      const adapter = await hre.ethers.getContractFactory(adapterContractName)
      const adapterFunctionSelector =
        adapter.interface.getFunction('sendMessage')?.selector!

      await accessManagementContract.setTargetFunctionRole(
        adapterAddress,
        [adapterFunctionSelector],
        BRIDGE_ROLE
      )

      console.log(
        'ℹ️ bridge -> adapter',
        adapterAddress,
        [adapterFunctionSelector],
        BRIDGE_ROLE
      )

      // grant function role (receive message)
      // router -> adapter
      await accessManagementContract.setTargetFunctionRole(
        adapterAddress,
        [adapterBytes4Signature],
        ROUTER_ROLE
      )

      console.log(
        'ℹ️ router -> adapter',
        adapterAddress,
        [adapterBytes4Signature],
        ROUTER_ROLE
      )

      const bridge = await hre.ethers.getContractFactory('Bridge')
      const bridgeFunctionSelector =
        bridge.interface.getFunction('receiveERC721')?.selector!

      await accessManagementContract.setTargetFunctionRole(
        bridgeAddress,
        [bridgeFunctionSelector],
        ADAPTER_ROLE
      )

      console.log(
        'ℹ️ adapter -> bridge',
        bridgeAddress,
        [bridgeFunctionSelector],
        ADAPTER_ROLE
      )

      spinner.stop()
      console.log(`✅ Roles granted to bridge, adapter and router`)
    }
  )
