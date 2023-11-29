import { task } from 'hardhat/config'
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
}

task('deploy-test-nft-contract', 'deploy nft contract')
  .addParam('tokenName', 'token name')
  .addParam('tokenSymbol', 'token symbol')
  .addParam('bridgeAddress', 'bridge address')
  .addParam('adapterAddress', 'adapter address')
  .addParam('targetNetwork', 'target network')
  .setAction(
    async (
      {
        tokenName,
        tokenSymbol,
        bridgeAddress,
        targetNetwork,
        adapterAddress
      }: DeployTestNFTContractTask,
      hre
    ) => {
      spinner.start()
      const chainConfig = allowedChainsConfig[+hre.network.name]
      if (!chainConfig) throw new Error('Chain config not found')

      console.log(
        `ℹ️ Deploying new NFT ${tokenName} with symbol ${tokenSymbol} to ${chainConfig.id}`
      )

      const tokenId = 1

      const nft = await hre.ethers.deployContract('MockNFT', [
        tokenName,
        tokenSymbol
      ])

      const [deployer] = await hre.ethers.getSigners()

      await nft.waitForDeployment()
      await nft.safeMint(
        deployer.address,
        tokenId,
        'https://cdn.routescan.io/_next/image?url=https%3A%2F%2Fcms-cdn.avascan.com%2FROTW_Logo_bdd6b5e9d7.png%3F15707150.299999997&w=32&q=100'
      )

      const nftAddress = await nft.getAddress()

      try {
        const bridge = await hre.ethers.getContractAt('Bridge', bridgeAddress)

        const adapter = await hre.ethers.getContractAt(
          'CCIPAdapter',
          adapterAddress
        )

        const abiCoder = hre.ethers.AbiCoder.defaultAbiCoder()

        const targetChainSettings = await bridge.getChainSettings(
          targetNetwork,
          RampType.OnRamp
        )

        const payload = {
          toChain: targetChainSettings.nonEvmChainId,
          receiver: targetChainSettings.adapter,
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

        await nft.approve(bridgeAddress, tokenId)

        await bridge.sendERC721(
          targetChainSettings.evmChainId,
          nftAddress,
          tokenId,
          {
            value: fee
          }
        )

        const nftOwner = await nft.ownerOf(tokenId)

        spinner.stop()
        console.log(`✅ NFT deployed and transfered to ${nftOwner}`)
      } catch (error) {
        spinner.stop()
        console.log(`❌ NFT deploy failed`)
        console.log(error)
      }
    }
  )
