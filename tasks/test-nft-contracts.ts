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
  nftAddress: string
  tokenId: number
  accountIndex: number
}

task('test-nft-contract', 'deploy nft contract')
  .addParam('tokenName', 'token name')
  .addParam('tokenSymbol', 'token symbol')
  .addParam('bridgeAddress', 'bridge address')
  .addParam('adapterAddress', 'adapter address')
  .addParam('targetNetwork', 'target network')
  .addParam('nftAddress', 'nft address')
  .addParam('tokenId', 'token id')
  .addOptionalParam(
    'accountIndex',
    'Account index to use for deployment',
    0,
    types.int
  )
  .setAction(
    async (
      {
        nftAddress,
        tokenName,
        tokenSymbol,
        bridgeAddress,
        targetNetwork,
        adapterAddress,
        tokenId,
        accountIndex
      }: DeployTestNFTContractTask,
      hre
    ) => {
      spinner.start()
      const chainConfig = allowedChainsConfig[+hre.network.name]
      if (!chainConfig) throw new Error('Chain config not found')

      console.log(
        `ℹ️ Deploying new NFT ${tokenName} with symbol ${tokenSymbol} to ${chainConfig.id}`
      )

      const provider = new hre.ethers.JsonRpcProvider(
        chainConfig.rpcUrls.default.http[0],
        chainConfig.id
      )

      const deployer = new hre.ethers.Wallet(
        chainConfig.accounts[accountIndex],
        provider
      )

      try {
        const nft = await hre.ethers.getContractAt(
          'MockNFT',
          nftAddress,
          deployer
        )
        const bridge = await hre.ethers.getContractAt(
          'Bridge',
          bridgeAddress,
          deployer
        )

        const adapter = await hre.ethers.getContractAt(
          'CCIPAdapter',
          adapterAddress,
          deployer
        )

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
                [chainConfig.id, nftAddress, tokenId]
              ),
              abiCoder.encode(
                ['string', 'string', 'string'],
                [tokenName, tokenSymbol, await nft.tokenURI(tokenId)]
              )
            ]
          )
        }

        console.log('ℹ️ Getting required fee')
        const fee = await adapter.getFee(payload)
        console.log('ℹ️ Feee', fee)

        console.log('ℹ️ Approving')
        const tx2 = await nft.approve(bridgeAddress, tokenId)
        await tx2.wait()
        console.log('ℹ️ Approved')

        await bridge.sendERC721(
          targetChainSettings.evmChainId,
          nftAddress,
          tokenId,
          {
            value: fee + 2560000n
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
