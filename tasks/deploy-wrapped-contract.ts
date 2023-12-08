import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

export type DeployWrappedTokenTask = {
  accountIndex: number
  tokenName: string
  tokenSymbol: string
}

task('deploy-wrapped-contract', 'deploy wrapped token contract ')
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

        const [receiver] = await hre.ethers.getSigners()

        const tokenId = 1

        console.log(
          `ℹ️ Deployng new wrapped ERC721 ${tokenName} with symbol ${tokenSymbol} to ${chainConfig.id}`
        )

        const nft = await hre.ethers.deployContract(
          'WERC721',
          [receiver.address, tokenName, tokenSymbol],
          deployer
        )
        const nftAddress = await nft.getAddress()

        const tx = await nft.waitForDeployment()
        const receipt = await tx.deploymentTransaction()?.wait()
        const gasUsed = receipt?.gasUsed || 0n

        spinner.stop()

        console.log('ℹ️ Done and gas used: ', gasUsed)

        /**
         *
         */

        spinner.start()
        console.log('ℹ️ Minting: ', tokenId)

        const tx2 = await nft.bridgeMint(receiver.address, tokenId, '0x')
        const receipt2 = await tx2.wait()
        const gasUsed2 = receipt2?.gasUsed || 0n
        spinner.stop()

        console.log('ℹ️ Done and gas used: ', gasUsed2)

        /**
         *
         */

        console.log(`✅ Deployed NFT ${tokenName} at: `, nftAddress)
      } catch (error) {
        spinner.stop()
        console.log(`❌ NFT ${tokenName} deploy failed`)
        console.log(error)
      }
    }
  )
