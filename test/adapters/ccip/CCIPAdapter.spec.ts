import { Client } from '@/typechain/@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IAny2EVMMessageReceiver'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployAccessManagementFixture } from '@/test/accessManagement/fixtures'

import {
  deployCCIPAdapterFixture,
  deployMockCCIPRouterFixture,
  deployMockBridgeFixture
} from './fixture'

import { IBridge } from '@/typechain'
import { abiCoder, getSigners } from '@/scripts/utils'
import { AccessManagement } from '@/typechain/contracts/AccessManagement'

describe('CCIPAdapter', function () {
  let accessManagement: AccessManagement
  let accessManagementAddress: string

  beforeEach(async function () {
    // initialize access management fixture
    const fixture = await loadFixture(deployAccessManagementFixture)
    accessManagement = fixture.accessManagement
    accessManagementAddress = fixture.accessManagementAddress
  })

  it('should return router address', async function () {
    const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

    const routerAddress = '0x00000000000000000000000000000000000000D2'

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        this,
        mockBridgeAddress,
        accessManagementAddress,
        routerAddress
      )
    )

    const router = await ccipAdapter.router()

    expect(router).to.be.equal(routerAddress)
  })

  it('should return bridge address', async function () {
    const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

    const routerAddress = '0x00000000000000000000000000000000000000D2'

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        this,
        mockBridgeAddress,
        accessManagementAddress,
        routerAddress
      )
    )

    const bridge = await ccipAdapter.bridge()

    expect(bridge).to.be.equal(mockBridgeAddress)
  })

  it('should return fee token as zero address', async function () {
    const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

    const routerAddress = '0x00000000000000000000000000000000000000D2'

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        this,
        mockBridgeAddress,
        accessManagementAddress,
        routerAddress
      )
    )

    const feeToken = await ccipAdapter.feeToken()

    expect(feeToken).to.be.equal(ethers.ZeroAddress)
  })

  it('should return amount fee for sending message', async function () {
    const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

    const { mockCCIPRouterAddress, mockCCIPRouter } = await loadFixture(
      deployMockCCIPRouterFixture
    )

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        this,
        mockBridgeAddress,
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
    const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

    const { mockCCIPRouterAddress } = await loadFixture(
      deployMockCCIPRouterFixture
    )

    const [, developer] = await getSigners()

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        this,
        mockBridgeAddress,
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
    const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

    const { mockCCIPRouterAddress } = await loadFixture(
      deployMockCCIPRouterFixture
    )

    const [, developer] = await getSigners()

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        this,
        mockBridgeAddress,
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
    const [, otherSideCaller] = await getSigners()

    const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

    const { mockCCIPRouterAddress } = await loadFixture(
      deployMockCCIPRouterFixture
    )

    const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        this,
        mockBridgeAddress,
        accessManagementAddress,
        mockCCIPRouterAddress
      )
    )

    await accessManagement.setTargetFunctionRole(
      ccipAdapterAddress,
      [ccipAdapter.interface.getFunction('ccipReceive').selector],
      0n // admin role
    )

    const payload: Client.Any2EVMMessageStruct = {
      messageId: ethers.encodeBytes32String('messsage_id'),
      sourceChainSelector: 80_001n,
      sender: abiCoder.encode(['address'], [otherSideCaller.address]),
      data: abiCoder.encode(['string'], ['hello']),
      destTokenAmounts: []
    }

    const expectedMessage: IBridge.MessageReceiveStruct = {
      fromChain: payload.sourceChainSelector,
      sender: otherSideCaller.address, // it will get the decoded version of the sender
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

  it('should send message to router', async function () {
    const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

    const { mockCCIPRouterAddress } = await loadFixture(
      deployMockCCIPRouterFixture
    )

    const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        this,
        mockBridgeAddress,
        accessManagementAddress,
        mockCCIPRouterAddress
      )
    )

    await accessManagement.setTargetFunctionRole(
      ccipAdapterAddress,
      [ccipAdapter.interface.getFunction('sendMessage').selector],
      0n // admin role
    )

    const payload: IBridge.MessageSendStruct = {
      toChain: 80_001,
      receiver: ethers.ZeroAddress,
      data: '0x'
    }

    await expect(ccipAdapter.sendMessage(payload))
      .to.emit(ccipAdapter, 'MessageSent')
      .withArgs([payload.toChain, payload.receiver, payload.data])
  })

  it('should revert sending message to router without fee amount', async function () {
    const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

    const { mockCCIPRouterAddress, mockCCIPRouter } = await loadFixture(
      deployMockCCIPRouterFixture
    )

    const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        this,
        mockBridgeAddress,
        accessManagementAddress,
        mockCCIPRouterAddress
      )
    )

    await accessManagement.setTargetFunctionRole(
      ccipAdapterAddress,
      [ccipAdapter.interface.getFunction('sendMessage').selector],
      0n // admin role
    )

    const payload: IBridge.MessageSendStruct = {
      toChain: 80_001,
      receiver: ethers.ZeroAddress,
      data: '0x'
    }

    const expectedAmount = 200_000

    await mockCCIPRouter.setFee(expectedAmount)

    await expect(
      ccipAdapter.sendMessage(payload, {
        value: expectedAmount - 1
      })
    ).to.be.revertedWithCustomError(ccipAdapter, 'InsufficientFeeTokenAmount')
  })

  it('should revert on transfer native tokens', async function () {
    const [owner] = await getSigners()

    const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

    const routerAddress = '0x00000000000000000000000000000000000000D2'

    const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        this,
        mockBridgeAddress,
        accessManagementAddress,
        routerAddress
      )
    )

    expect(
      owner.sendTransaction({
        to: ccipAdapterAddress,
        value: 100_000
      })
    ).to.be.revertedWithCustomError(ccipAdapter, 'DepositNotAllowed')
  })

  it('should revert on call fallback function', async function () {
    const [owner] = await getSigners()

    const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

    const routerAddress = '0x00000000000000000000000000000000000000D2'

    const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        this,
        mockBridgeAddress,
        accessManagementAddress,
        routerAddress
      )
    )

    const notExistentFunctionSignature = abiCoder.encode(
      ['bytes4'],
      ['0x00000000']
    )

    expect(
      owner.sendTransaction({
        to: ccipAdapterAddress,
        data: notExistentFunctionSignature
      })
    ).to.be.revertedWithCustomError(ccipAdapter, 'FallbackNotAllowed')
  })
})
