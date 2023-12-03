import { task, types } from 'hardhat/config'
import { Spinner } from '../scripts/spinner'
import cliSpinner from 'cli-spinners'
import { allowedChainsConfig } from '@/config/config'
import { RampType } from './set-chain-settings'

const spinner: Spinner = new Spinner(cliSpinner.aesthetic)

export type DeployTestERC721ContractTask = {
  fromChain: number
  sender: string
  data: string
}

task('decode-message', 'decode bridged ERC721 message')
  .addParam('fromChain', '')
  .addParam('sender', '')
  .addParam('data', '')
  .setAction(
    async ({ fromChain, sender, data }: DeployTestERC721ContractTask, hre) => {
      spinner.start()

      try {
        const abiCoder = hre.ethers.AbiCoder.defaultAbiCoder()

        // const payload = {
        //   toChain: targetChainSettings.nonEvmChainId,
        //   receiver: targetChainSettings.adapter,
        //   gasLimit: targetChainSettings.gasLimit,
        //   data: abiCoder.encode(
        //     ['address', 'bytes', 'bytes'],
        //     [
        //       deployer.address,
        //       abiCoder.encode(
        //         ['uint256', 'address', 'uint256'],
        //         [chainConfig.id, ERC721Address, tokenId]
        //       ),
        //       abiCoder.encode(
        //         ['string', 'string', 'string'],
        //         [tokenName, tokenSymbol, await ERC721.tokenURI(tokenId)]
        //       )
        //     ]
        //   )
        // }

        spinner.stop()
        console.log(`✅ Message decoded:`)
      } catch (error) {
        spinner.stop()
        console.log(error)
        console.log(`❌ Message decode failed`)
      }
    }
  )
