import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'
import { RampType } from './set-chain-settings'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

export type DeployTestERC721ContractTask = {
  tokenName: string
  tokenSymbol: string
  bridgeAddress: string
  adapterAddress: string
  targetNetwork: number
  feeTokenName: 'LINK'
  accountIndex: number
}

task('bridge-erc721-using-erc20', 'bridge ERC721 contract using erc20 token')
  .addParam('tokenName', 'token name')
  .addParam('tokenSymbol', 'token symbol')
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
        tokenName,
        tokenSymbol,
        bridgeAddress,
        targetNetwork,
        adapterAddress,
        accountIndex,
        feeTokenName
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

        console.log(
          `ℹ️ Deploying ERC721 ${tokenName} with symbol ${tokenSymbol} to ${chainConfig.id}`
        )

        const ERC721 = await hre.ethers.deployContract(
          'MockERC721',
          [tokenName, tokenSymbol],
          deployer
        )

        await ERC721.waitForDeployment()
        const ERC721Address = await ERC721.getAddress()

        const tokenId = 1

        console.log('ℹ️ Minting: ', tokenId)

        const tx = await ERC721.mint(tokenId)
        const receipt = await tx.wait()
        const gasUsed = receipt?.gasUsed || 0n

        spinner.stop()

        console.log('ℹ️ Done and gas used: ', gasUsed)

        /**
         *
         */

        spinner.start()

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

        const targetEvmChainIdSettings = await bridge.getEvmChainIdSettings(
          targetNetwork,
          RampType.OnRamp
        )

        const payload = {
          toChain: targetEvmChainIdSettings.nonEvmChainId,
          receiver: targetEvmChainIdSettings.adapter,
          gasLimit: targetEvmChainIdSettings.gasLimit,
          data: abiCoder.encode(
            ['address', 'bytes', 'bytes'],
            [
              deployer.address,
              abiCoder.encode(
                ['uint256', 'address', 'uint256'],
                [chainConfig.id, ERC721Address, tokenId]
              ),
              abiCoder.encode(
                ['string', 'string', 'string'],
                [tokenName, tokenSymbol, await ERC721.tokenURI(tokenId)]
              )
            ]
          )
        }

        const fee = await adapter.getFee(payload)

        spinner.stop()

        console.log('ℹ️ Required feee:', fee)

        /**
         *
         */

        spinner.start()

        console.log('ℹ️ Approving ERC721 to bridge')
        const tx2 = await ERC721.approve(bridgeAddress, tokenId)
        await tx2.wait()

        const receipt2 = await tx2.wait()
        const gasUsed2 = receipt2?.gasUsed || 0n

        spinner.stop()

        console.log('ℹ️ Done and gas used: ', gasUsed2)
        /**
         *
         */

        spinner.start()

        console.log(`ℹ️ Approving bridge to spend ERC20 tokens`)

        const ERC20 = await hre.ethers.getContractAt(
          'ERC20',
          chainConfig.assets[feeTokenName].address,
          deployer
        )

        const tx4 = await ERC20.approve(bridgeAddress, fee)
        const receipt4 = await tx4.wait()
        const gasUsed4 = receipt4?.gasUsed || 0n

        spinner.stop()

        console.log('ℹ️ Done and gas used: ', gasUsed4)

        /**
         *
         */

        spinner.start()

        console.log('ℹ️ Estimating gas')

        const estimateGas = await bridge.sendERC721UsingERC20.estimateGas(
          targetEvmChainIdSettings.evmChainId,
          ERC721Address,
          tokenId,
          fee
        )

        spinner.stop()

        console.log('ℹ️ Gas estimate', estimateGas)

        /**
         *
         */

        spinner.start()

        console.log(
          `ℹ️ Sending ERC721 ${ERC721Address} to bridge using ${feeTokenName}`
        )

        const tx3 = await bridge.sendERC721UsingERC20(
          targetEvmChainIdSettings.evmChainId,
          ERC721Address,
          tokenId,
          fee
        )

        const receipt3 = await tx3.wait()
        const gasUsed3 = receipt3?.gasUsed || 0n

        spinner.stop()

        console.log('ℹ️ Done and gas used: ', gasUsed3)

        /**
         *
         */
        spinner.start()

        const ERC721Owner = await ERC721.ownerOf(tokenId)
        console.log('ℹ️ Checking transfer')

        spinner.stop()
        console.log(
          `✅ ERC721 ${tokenName} deployed and transfered to ${ERC721Owner}`
        )
      } catch (error) {
        spinner.stop()
        console.log(error)
        console.log(`❌ ERC721 ${tokenName}  deploy failed`)
      }
    }
  )
