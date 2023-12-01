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

      try {
        const chainConfig = allowedChainsConfig[+hre.network.name]
        if (!chainConfig) {
          spinner.stop()
          throw new Error('Chain config not found')
        }

        const wallet = new hre.ethers.Wallet(chainConfig.accounts[accountIndex])

        const provider = new hre.ethers.JsonRpcProvider(
          chainConfig.rpcUrls.default.http[0],
          chainConfig.id
        )

        const deployer = wallet.connect(provider)

        const accessManagementAddress =
          chainConfig.contracts.accessManagement.address

        const accessManagementContract = await hre.ethers.getContractAt(
          'AccessManagement',
          accessManagementAddress,
          deployer
        )

        console.log(`ℹ️ Grating roles to contracts`)

        await accessManagementContract.waitForDeployment()

        /**
         *
         */
        console.log('ℹ️ Granting adapter router role: ', ROUTER_ROLE)

        const tx = await accessManagementContract.grantRole(
          ROUTER_ROLE,
          adapterRouterAddress,
          ROUTER_ROLE_DELAY
        )

        const receipt = await tx.wait()
        const gasUsed = receipt?.gasUsed || 0n

        console.log('ℹ️ Done and gas used: ', gasUsed)

        /**
         *
         */

        console.log('ℹ️ Granting adapter role: ', ADAPTER_ROLE)

        const tx2 = await accessManagementContract.grantRole(
          ADAPTER_ROLE,
          adapterAddress,
          ADAPTER_ROLE_DELAY
        )

        const receipt2 = await tx2.wait()
        const gasUsed2 = receipt2?.gasUsed || 0n

        console.log('ℹ️ Done and gas used: ', gasUsed2)

        /**
         *
         */

        console.log('ℹ️ Granting bridge role: ', BRIDGE_ROLE)

        const tx3 = await accessManagementContract.grantRole(
          BRIDGE_ROLE,
          bridgeAddress,
          BRIDGE_ROLE_DELAY
        )

        const receipt3 = await tx3.wait()
        const gasUsed3 = receipt3?.gasUsed || 0n

        console.log('ℹ️ Done and gas used: ', gasUsed3)

        /**
         * send messages
         */

        const adapterFunctionSelectorName = 'sendMessage'

        console.log(
          'ℹ️ Granting bridge role to adapter function selector:',
          adapterFunctionSelectorName
        )

        const adapter = await hre.ethers.getContractAt(
          adapterContractName,
          deployer
        )

        await adapter.waitForDeployment()

        const adapterFunctionSelector = adapter.interface.getFunction(
          adapterFunctionSelectorName
        )?.selector!

        const tx4 = await accessManagementContract.setTargetFunctionRole(
          adapterAddress,
          [adapterFunctionSelector],
          BRIDGE_ROLE
        )

        const receipt4 = await tx4.wait()
        const gasUsed4 = receipt4?.gasUsed || 0n
        console.log('ℹ️ Done and gas used: ', gasUsed4)

        /**
         * receive messages
         */
        console.log(
          'ℹ️ Granting router role to adapter function selector:',
          adapterBytes4Signature
        )

        const tx5 = await accessManagementContract.setTargetFunctionRole(
          adapterAddress,
          [adapterBytes4Signature],
          ROUTER_ROLE
        )

        await tx5.wait()
        const receipt5 = await tx5.wait()
        const gasUsed5 = receipt5?.gasUsed || 0n
        console.log('ℹ️ Done and gas used: ', gasUsed5)

        /**
         *
         */

        const bridgeFunctionSelectorName = 'receiveERC721'

        console.log(
          'ℹ️ Granting adapter role to bridge function selector:',
          bridgeFunctionSelectorName
        )

        const bridge = await hre.ethers.getContractAt('Bridge', deployer)
        await bridge.waitForDeployment()

        const bridgeFunctionSelector = bridge.interface.getFunction(
          bridgeFunctionSelectorName
        )?.selector!

        const tx6 = await accessManagementContract.setTargetFunctionRole(
          bridgeAddress,
          [bridgeFunctionSelector],
          ADAPTER_ROLE
        )

        await tx6.wait()

        const receipt6 = await tx6.wait()
        const gasUsed6 = receipt6?.gasUsed || 0n

        console.log('ℹ️ Done and gas used: ', gasUsed6)

        spinner.stop()
        console.log(`✅ Roles granted to contracts`)
      } catch (error) {
        spinner.stop()
        console.log(`❌ Granting role to contracts failed`)
        console.log(error)
      }
    }
  )
