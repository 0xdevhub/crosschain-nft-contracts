import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'
import { RampType } from './set-chain-settings'

const spinner: Spinner = new Spinner(cliSpinner.aesthetic)

export type DeployTestERC721ContractTask = {
  bridgeAddress: string
  adapterAddress: string
  targetNetwork: number
  feeTokenName: 'LINK'
  accountIndex: number
  tokenAddress: string
  tokenId: number
  originChainEvmId: number
}

task('bridge-erc721', 'bridge ERC721 contract using erc20 token')
  .addParam('tokenAddress', 'token address')
  .addParam('tokenId', 'token id')
  .addParam('originChainEvmId', 'origin chain evm id')
  .addParam('bridgeAddress', 'bridge address')
  .addParam('adapterAddress', 'adapter address')
  .addParam('targetNetwork', 'target network')
  .addParam('feeTokenName', 'fee token address')
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
        targetNetwork,
        adapterAddress,
        accountIndex,
        feeTokenName,
        tokenAddress,
        tokenId,
        originChainEvmId
      }: DeployTestERC721ContractTask,
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

        const ERC721 = await hre.ethers.getContractAt(
          'ERC721',
          tokenAddress,
          deployer
        )

        const tokenName = await ERC721.name()
        const tokenSymbol = await ERC721.symbol()

        console.log(
          `ℹ️ Briding ERC721 ${tokenName} with symbol ${tokenSymbol} to ${chainConfig.id}`
        )

        /**
         *
         */

        console.log('ℹ️ Getting required fee from adapter')

        const bridge = await hre.ethers.getContractAt(
          'Bridge',
          bridgeAddress,
          deployer
        )

        await bridge.waitForDeployment()

        const adapter = await hre.ethers.getContractAt(
          'CCIPAdapter',
          adapterAddress,
          deployer
        )

        await adapter.waitForDeployment()

        const abiCoder = hre.ethers.AbiCoder.defaultAbiCoder()

        const targetChainSettings = await bridge.getChainSettings(
          targetNetwork,
          RampType.OnRamp
        )

        const payload = {
          toChain: targetChainSettings.nonEvmChainId,
          receiver: targetChainSettings.adapter,
          gasLimit: targetChainSettings.gasLimit,
          data: abiCoder.encode(
            ['address', 'bytes', 'bytes'],
            [
              deployer.address,
              abiCoder.encode(
                ['uint256', 'address', 'uint256'],
                [originChainEvmId, tokenAddress, tokenId]
              ),
              abiCoder.encode(
                ['string', 'string', 'string'],
                [tokenName, tokenSymbol, await ERC721.tokenURI(tokenId)]
              )
            ]
          )
        }

        const fee = await adapter.getFee(payload)

        console.log('ℹ️ Required feee:', fee)

        /**
         *
         */

        console.log('ℹ️ Approving ERC721 to bridge')
        const tx2 = await ERC721.approve(bridgeAddress, tokenId)
        await tx2.wait()

        const receipt2 = await tx2.wait()
        const gasUsed2 = receipt2?.gasUsed || 0n
        console.log('ℹ️ Done and gas used: ', gasUsed2)
        /**
         *
         */

        console.log(`ℹ️ Approving bridge to spend ERC20 tokens`)

        const ERC20 = await hre.ethers.getContractAt(
          'ERC20',
          chainConfig.assets[feeTokenName].address,
          deployer
        )

        const tx4 = await ERC20.approve(bridgeAddress, fee)
        const receipt4 = await tx4.wait()
        const gasUsed4 = receipt4?.gasUsed || 0n

        console.log('ℹ️ Done and gas used: ', gasUsed4)

        /**
         *
         */

        console.log('ℹ️ Estimating gas')

        const estimateGas = await bridge.sendERC721UsingERC20.estimateGas(
          targetChainSettings.evmChainId,
          tokenAddress,
          tokenId,
          fee
        )

        console.log('ℹ️ Gas estimate', estimateGas)

        /**
         *
         */

        console.log(`ℹ️ Sending ERC721 to bridge using ${feeTokenName}`)

        const tx3 = await bridge.sendERC721UsingERC20(
          targetChainSettings.evmChainId,
          tokenAddress,
          tokenId,
          fee
        )

        const receipt3 = await tx3.wait()
        const gasUsed3 = receipt3?.gasUsed || 0n

        console.log('ℹ️ Done and gas used: ', gasUsed3)

        /**
         *
         */

        spinner.stop()
        console.log(`✅ ERC721 ${tokenName} transfered`)
      } catch (error) {
        spinner.stop()
        console.log(error)
        console.log(`❌ ERC721 bridge failed`)
      }
    }
  )
