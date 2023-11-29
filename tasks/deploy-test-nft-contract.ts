import { task } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

export type DeployTestNFTContractTask = {
  tokenName: string
  tokenSymbol: string
}

task('deploy-test-nft-contract', 'deploy nft contract')
  .addParam('tokenName', 'token name')
  .addParam('tokenSymbol', 'token symbol')
  .setAction(
    async ({ tokenName, tokenSymbol }: DeployTestNFTContractTask, hre) => {
      spinner.start()
      const chainConfig = allowedChainsConfig[+hre.network.name]
      if (!chainConfig) throw new Error('Chain config not found')

      console.log(
        `ℹ️ Deploying new NFT ${tokenName} with symbol ${tokenSymbol} to ${chainConfig.id}`
      )
      const NFTContract = await hre.ethers.getContractFactory('MockNFT')
      const nft = await NFTContract.deploy(tokenName, tokenSymbol)
      await nft.waitForDeployment()
      const nftAddress = await nft.getAddress()

      spinner.stop()
      console.log(`✅ NFT deployed to ${nftAddress}`)
    }
  )
