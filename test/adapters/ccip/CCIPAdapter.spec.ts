import { Client } from '@/typechain/@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IAny2EVMMessageReceiver'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployAccessManagementFixture } from '@/test/accessManagement/fixtures'

import {
  deployCCIPAdapterFixture,
  deployCCIPRouterMockFixture
} from './fixture'
import { IBaseAdapter, IBridge } from '@/typechain'

describe('CCIPAdapter', function () {
  it('should return router address', async function () {
    const bridgeAddress = ethers.ZeroAddress
    const accessManagementAddress = ethers.ZeroAddress
    const routerAddress = '0x00000000000000000000000000000000000000D2'

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        null,
        bridgeAddress,
        accessManagementAddress,
        routerAddress
      )
    )

    const router = await ccipAdapter.router()

    expect(router).to.be.equal(routerAddress)
  })

  it('should set bridge address', async function () {
    const bridgeAddress = '0x00000000000000000000000000000000000000B8'
    const accessManagementAddress = ethers.ZeroAddress
    const routerAddress = '0x00000000000000000000000000000000000000D2'

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        null,
        bridgeAddress,
        accessManagementAddress,
        routerAddress
      )
    )

    const bridge = await ccipAdapter.bridge()

    expect(bridge).to.be.equal(bridgeAddress)
  })

  it('should return fee token as zero address', async function () {
    const bridgeAddress = ethers.ZeroAddress
    const accessManagementAddress = ethers.ZeroAddress
    const routerAddress = '0x00000000000000000000000000000000000000D2'

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        null,
        bridgeAddress,
        accessManagementAddress,
        routerAddress
      )
    )

    const feeToken = await ccipAdapter.feeToken()

    expect(feeToken).to.be.equal(ethers.ZeroAddress)
  })

  it('should return the required amount fee for sending message', async function () {
    const bridgeAddress = ethers.ZeroAddress
    const accessManagementAddress = ethers.ZeroAddress
    const { mockCCIPRouterAddress, mockCCIPRouter } = await loadFixture(
      deployCCIPRouterMockFixture
    )

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        null,
        bridgeAddress,
        accessManagementAddress,
        mockCCIPRouterAddress
      )
    )

    const expectedAmount = 200_000

    await mockCCIPRouter.setFee(expectedAmount)

    const payload: IBridge.MessageSendStruct = {
      toChain: 80_001,
      receiver: ethers.ZeroAddress,
      data: '0x'
    }

    const requiredFee = await ccipAdapter.getFee(payload)

    expect(requiredFee).to.be.equal(expectedAmount)
  })

  it('should revert if receive message from unknown sender', async function () {
    const bridgeAddress = ethers.ZeroAddress

    const { mockCCIPRouterAddress } = await loadFixture(
      deployCCIPRouterMockFixture
    )

    const [, developer] = await ethers.getSigners()

    const { accessManagementAddress } = await loadFixture(
      deployAccessManagementFixture
    )

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        null,
        bridgeAddress,
        accessManagementAddress,
        mockCCIPRouterAddress
      )
    )

    /**
     *  bytes32 messageId; // MessageId corresponding to ccipSend on source.
        uint64 sourceChainSelector; // Source chain selector.
        bytes sender; // abi.decode(sender) if coming from an EVM chain.
        bytes data; // payload sent in original message.
        EVMTokenAmount[] destTokenAmounts; // Tokens and their amounts in their destination chain representation.
     */

    const payload: Client.Any2EVMMessageStruct = {
      messageId: ethers.encodeBytes32String('messsage_id'),
      sourceChainSelector: 80_001,
      sender: ethers.ZeroAddress,
      data: '0x',
      destTokenAmounts: []
    }

    await expect(
      ccipAdapter.connect(developer).ccipReceive(payload)
    ).to.be.revertedWithCustomError(ccipAdapter, 'AccessManagedUnauthorized')
  })

  it('should revert if send message from unknown sender', async function () {
    const bridgeAddress = ethers.ZeroAddress

    const { mockCCIPRouterAddress } = await loadFixture(
      deployCCIPRouterMockFixture
    )

    const [, developer] = await ethers.getSigners()

    const { accessManagementAddress } = await loadFixture(
      deployAccessManagementFixture
    )

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        null,
        bridgeAddress,
        accessManagementAddress,
        mockCCIPRouterAddress
      )
    )

    const payload: IBridge.MessageSendStruct = {
      toChain: 80_001,
      receiver: ethers.ZeroAddress,
      data: '0x'
    }

    await expect(
      ccipAdapter.connect(developer).sendMessage(payload)
    ).to.be.revertedWithCustomError(ccipAdapter, 'AccessManagedUnauthorized')
  })

  it('should receive message from router', async function () {
    const [owner] = await ethers.getSigners()
    const bridgeAddress = ethers.ZeroAddress

    const { mockCCIPRouterAddress } = await loadFixture(
      deployCCIPRouterMockFixture
    )

    const { accessManagement, accessManagementAddress } = await loadFixture(
      deployAccessManagementFixture
    )

    const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        null,
        bridgeAddress,
        accessManagementAddress,
        mockCCIPRouterAddress
      )
    )

    await accessManagement.setTargetFunctionRole(
      ccipAdapterAddress,
      [ccipAdapter.interface.getFunction('ccipReceive').selector],
      0n // admin role
    )

    const abiCoder = ethers.AbiCoder.defaultAbiCoder()

    const payload: Client.Any2EVMMessageStruct = {
      messageId: ethers.encodeBytes32String('messsage_id'),
      sourceChainSelector: 80_001n,
      sender: abiCoder.encode(['address'], [ethers.ZeroAddress]),
      data: abiCoder.encode(['string'], ['hello']),
      destTokenAmounts: []
    }

    const expectedMessage: IBridge.MessageReceiveStruct = {
      fromChain: payload.sourceChainSelector,
      sender: ethers.ZeroAddress,
      data: payload.data
    }

    await expect(ccipAdapter.ccipReceive(payload))
      .to.emit(ccipAdapter, 'MessageReceived')
      .withArgs([
        expectedMessage.fromChain,
        expectedMessage.sender,
        expectedMessage.data
      ])
  })
})
