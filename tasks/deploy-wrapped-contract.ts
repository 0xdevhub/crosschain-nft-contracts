import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'

const spinner: Spinner = new Spinner(cliSpinner.aesthetic)

export type DeployWrappedTokenTask = {
  accountIndex: number
  tokenName: string
  tokenSymbol: string
}

task('deploy-wrapped-token', 'deploy wrapped token')
  .addParam('tokenName', 'token name')
  .addParam('tokenSymbol', 'token symbol')
  .addOptionalParam(
    'accountIndex',
    'Account index to use for deployment',
    0,
    types.int
  )
  .setAction(
    async (
      { accountIndex, tokenName, tokenSymbol }: DeployWrappedTokenTask,
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

        const tokenId = 1

        console.log(
          `ℹ️ Deployng new wrapped ERC721 ${tokenName} with symbol ${tokenSymbol} to ${chainConfig.id}`
        )

        const nft = await hre.ethers.deployContract(
          'mockERC721',
          [tokenName, tokenSymbol],
          deployer
        )

        const tx = await nft.waitForDeployment()
        const receipt = await tx.deploymentTransaction()?.wait()
        const gasUsed = receipt?.gasUsed || 0n

        console.log('ℹ️ Done and gas used: ', gasUsed)

        /**
         *
         */

        console.log('ℹ️ Minting: ', tokenId)

        const tx2 = await nft.mint(tokenId)
        const receipt2 = await tx2.wait()
        const gasUsed2 = receipt2?.gasUsed || 0n

        console.log('ℹ️ Done and gas used: ', gasUsed2)

        /**
         *
         */

        const nftAddress = await nft.getAddress()

        spinner.stop()
        console.log(`✅ Deployed NFT ${tokenName} at: `, nftAddress)
      } catch (error) {
        spinner.stop()
        console.log(`❌ NFT ${tokenName} deploy failed`)
        console.log(error)
      }
    }
  )
