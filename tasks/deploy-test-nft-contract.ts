import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'
import { RampType } from './set-chain-settings'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

export type DeployTestNFTContractTask = {
  tokenName: string
  tokenSymbol: string
  bridgeAddress: string
  adapterAddress: string
  targetNetwork: number
  accountIndex: number
}

task('deploy-test-nft-contract', 'deploy nft contract')
  .addParam('tokenName', 'token name')
  .addParam('tokenSymbol', 'token symbol')
  .addParam('bridgeAddress', 'bridge address')
  .addParam('adapterAddress', 'adapter address')
  .addParam('targetNetwork', 'target network')
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
        accountIndex
      }: DeployTestNFTContractTask,
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
          `ℹ️ Deploying NFT ${tokenName} with symbol ${tokenSymbol} to ${chainConfig.id}`
        )

        const nft = await hre.ethers.deployContract(
          'MockNFT',
          [tokenName, tokenSymbol],
          deployer
        )

        await nft.waitForDeployment()

        const tokenId = 1

        console.log('ℹ️ Minting: ', tokenId)

        const tx = await nft.mint(tokenId)
        const receipt = await tx.wait()
        const gasUsed = receipt?.gasUsed || 0n

        console.log('ℹ️ Done and gas used: ', gasUsed)

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

        const nftAddress = await nft.getAddress()

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
                [chainConfig.id, nftAddress, tokenId]
              ),
              abiCoder.encode(
                ['string', 'string', 'string'],
                [tokenName, tokenSymbol, await nft.tokenURI(tokenId)]
              )
            ]
          )
        }

        const fee = await adapter.getFee(payload)

        console.log('ℹ️ Required feee:', fee)

        /**
         *
         */

        console.log('ℹ️ Approving NFT to bridge')
        const tx2 = await nft.approve(bridgeAddress, tokenId)
        await tx2.wait()

        const receipt2 = await tx2.wait()
        const gasUsed2 = receipt2?.gasUsed || 0n
        console.log('ℹ️ Done and gas used: ', gasUsed2)

        /**
         *
         */

        console.log('ℹ️ Estimating gas')

        const expectedInputValue =
          fee +
          chainConfig.crosschain.gasRequiredDeploy +
          chainConfig.crosschain.gasRequiredToMint

        const estimateGas = await bridge.sendERC721.estimateGas(
          targetChainSettings.evmChainId,
          nftAddress,
          tokenId,
          {
            value: expectedInputValue
          }
        )

        console.log('ℹ️ Gas estimate', estimateGas)

        const tx3 = await bridge.sendERC721(
          targetChainSettings.evmChainId,
          nftAddress,
          tokenId,
          {
            value: expectedInputValue
          }
        )

        const receipt3 = await tx3.wait()
        const gasUsed3 = receipt3?.gasUsed || 0n

        console.log('ℹ️ Done and gas used: ', gasUsed3)

        /**
         *
         */

        const nftOwner = await nft.ownerOf(tokenId)

        spinner.stop()
        console.log(
          `✅ NFT ${tokenName} deployed and transfered to ${nftOwner}`
        )
      } catch (error) {
        spinner.stop()
        console.log(error)
        console.log(`❌ NFT ${tokenName}  deploy failed`)
      }
    }
  )
