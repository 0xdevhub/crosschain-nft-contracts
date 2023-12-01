import { task, types } from 'hardhat/config'
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
  accountIndex: number
}

task('setup-bridge-adapter', 'setting up bridge and adapter')
  .addParam('bridgeAddress', 'bridge address')
  .addParam('adapterAddress', 'adapter address')
  .addParam('adapterRouterAddress', 'adapter router address')
  .addParam('adapterBytes4Signature', 'adapter bytes4 signature')
  .addParam('adapterContractName', 'adapter contract name')
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
        adapterAddress,
        adapterRouterAddress,
        adapterBytes4Signature,
        adapterContractName,
        accountIndex
      }: SetupBridgeAdapterTask,
      hre
    ) => {
      spinner.start()

      const chainConfig = allowedChainsConfig[+hre.network.name]
      if (!chainConfig) throw new Error('Chain config not found')

      const accessManagementAddress =
        chainConfig.contracts.accessManagement.address

      console.log(`ℹ️ Grating roles to bridge, adapter and router`)

      const wallet = new hre.ethers.Wallet(chainConfig.accounts[accountIndex])

      const provider = new hre.ethers.JsonRpcProvider(
        chainConfig.rpcUrls.default.http[0],
        chainConfig.id
      )

      const deployer = wallet.connect(provider)

      const accessManagementContract = await hre.ethers.getContractAt(
        'AccessManagement',
        accessManagementAddress,
        deployer
      )

      await accessManagementContract.waitForDeployment()

      // grant role (receive message)
      const tx = await accessManagementContract.grantRole(
        ROUTER_ROLE,
        adapterRouterAddress,
        ROUTER_ROLE_DELAY
      )
      await tx.wait()

      const tx2 = await accessManagementContract.grantRole(
        ADAPTER_ROLE,
        adapterAddress,
        ADAPTER_ROLE_DELAY
      )
      await tx2.wait()

      const tx3 = await accessManagementContract.grantRole(
        BRIDGE_ROLE,
        bridgeAddress,
        BRIDGE_ROLE_DELAY
      )

      await tx3.wait()

      // grant function role (send message)
      // bridge -> adapter
      const adapter = await hre.ethers.getContractAt(
        adapterContractName,
        deployer
      )

      await adapter.waitForDeployment()

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
      const tx5 = await accessManagementContract.setTargetFunctionRole(
        adapterAddress,
        [adapterBytes4Signature],
        ROUTER_ROLE
      )
      await tx5.wait()

      console.log(
        'ℹ️ router -> adapter',
        adapterAddress,
        [adapterBytes4Signature],
        ROUTER_ROLE
      )

      const bridge = await hre.ethers.getContractAt('Bridge', deployer)
      await bridge.waitForDeployment()

      const bridgeFunctionSelector =
        bridge.interface.getFunction('receiveERC721')?.selector!

      const tx6 = await accessManagementContract.setTargetFunctionRole(
        bridgeAddress,
        [bridgeFunctionSelector],
        ADAPTER_ROLE
      )

      await tx6.wait()

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
