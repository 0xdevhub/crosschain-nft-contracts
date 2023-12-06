import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { deployAccessManagementFixture } from '@/test/accessManagement/fixtures'
import { deployCCIPAdapterFixture } from './fixture'
import { deployMockERC20Fixture } from '@/test/mocks/erc20Fixture'
import { deployMockBridgeFixture } from '@/test/mocks/bridgeFixture'
import { deployMockCCIPRouterFixture } from '@/test/mocks/ccipRouterFixture'
import { abiCoder, getSigners } from '@/scripts/utils'
import { AccessManagement } from '@/typechain/contracts/AccessManagement'
import { Client } from '@/typechain/@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver'
import { BRIDGE_ROLE, ROUTER_ROLE } from '@/scripts/constants'
import { deployMockContractGeneralFixture } from '@/test/mocks/commonFixture'

describe('CCIPAdapter', function () {
  let accessManagement: AccessManagement
  let accessManagementAddress: string

  beforeEach(async function () {
    // initialize access management fixture
    const fixture = await loadFixture(deployAccessManagementFixture)
    accessManagement = fixture.accessManagement
    accessManagementAddress = fixture.accessManagementAddress
  })

  describe('Settings', () => {
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

      const router = await ccipAdapter.getRouter()

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

    it('should return fee token as zero address if not set', async function () {
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

    it('should return fee token erc20 token address if set', async function () {
      const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)
      const { mockERC20Address } = await loadFixture(deployMockERC20Fixture)

      const routerAddress = '0x00000000000000000000000000000000000000D2'

      const { ccipAdapter } = await loadFixture(
        deployCCIPAdapterFixture.bind(
          this,
          mockBridgeAddress,
          accessManagementAddress,
          routerAddress,
          mockERC20Address
        )
      )

      const feeToken = await ccipAdapter.feeToken()

      expect(feeToken).to.be.equal(mockERC20Address)
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

      const requiredFee = await ccipAdapter.getFee({
        toChain: 80_001,
        receiver: ethers.ZeroAddress,
        data: '0x',
        gasLimit: 0
      })

      expect(requiredFee).to.be.equal(expectedAmount)
    })
  })

  describe('Receive message', () => {
    it('should receive message from router and execute', async function () {
      const [fakeRouterCaller, otherSideCaller] = await getSigners()

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

      /// grant role to bridge contract
      await accessManagement.grantRole(ROUTER_ROLE, fakeRouterCaller.address, 0)
      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 80_001n,
        sender: abiCoder.encode(['address'], [otherSideCaller.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await expect(ccipAdapter.ccipReceive(payload))
        .to.emit(ccipAdapter, 'ERC721Received')
        .withArgs(
          payload.sourceChainSelector,
          otherSideCaller.address,
          payload.data
        )
    })

    it('should receive message from router and manually execute by limit', async function () {
      const [fakeRouterCaller, otherSideCaller] = await getSigners()

      const { mockBridgeAddress, mockBridge } = await loadFixture(
        deployMockBridgeFixture
      )

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

      /// grant role to bridge contract
      await accessManagement.grantRole(ROUTER_ROLE, fakeRouterCaller.address, 0)
      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 80001n,
        sender: abiCoder.encode(['address'], [otherSideCaller.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await mockBridge.lock(true)

      await ccipAdapter.ccipReceive(payload)

      await mockBridge.lock(false)

      await expect(ccipAdapter.manuallyExecuteMessages(1))
        .to.emit(ccipAdapter, 'ERC721Received')
        .withArgs(
          payload.sourceChainSelector,
          otherSideCaller.address,
          payload.data
        )
    })

    it('should return messages that has manually executed', async function () {
      const [fakeRouterCaller, otherSideCaller] = await getSigners()

      const { mockBridgeAddress, mockBridge } = await loadFixture(
        deployMockBridgeFixture
      )

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

      /// grant role to bridge contract
      await accessManagement.grantRole(ROUTER_ROLE, fakeRouterCaller.address, 0)
      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 80001n,
        sender: abiCoder.encode(['address'], [otherSideCaller.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await mockBridge.lock(true)
      await ccipAdapter.ccipReceive(payload)
      await mockBridge.lock(false)

      await ccipAdapter.manuallyExecuteMessages(1)

      const executedMessage = await ccipAdapter.getExecutedMessage(0)

      expect({
        fromChain: executedMessage.fromChain,
        sender: executedMessage.sender,
        data: executedMessage.data
      }).to.be.deep.equal({
        fromChain: payload.sourceChainSelector,
        sender: otherSideCaller.address,
        data: payload.data
      })
    })

    it('should return pending message that has not manually executed', async function () {
      const [fakeRouterCaller, otherSideCaller] = await getSigners()

      const { mockBridgeAddress, mockBridge } = await loadFixture(
        deployMockBridgeFixture
      )

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

      /// grant role to bridge contract
      await accessManagement.grantRole(ROUTER_ROLE, fakeRouterCaller.address, 0)
      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 80001n,
        sender: abiCoder.encode(['address'], [otherSideCaller.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await mockBridge.lock(true)

      await ccipAdapter.ccipReceive(payload)

      await mockBridge.lock(false)

      const pendingMessage = await ccipAdapter.getPendingMessage(0)

      expect({
        fromChain: pendingMessage.fromChain,
        sender: pendingMessage.sender,
        data: pendingMessage.data
      }).to.be.deep.equal({
        fromChain: payload.sourceChainSelector,
        sender: otherSideCaller.address,
        data: payload.data
      })
    })

    it('should receive message from router and execute manually by limit from pending messages', async function () {
      const [fakeRouterCaller, otherSideCaller] = await getSigners()

      const { mockBridgeAddress, mockBridge } = await loadFixture(
        deployMockBridgeFixture
      )

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

      /// grant role to bridge contract
      await accessManagement.grantRole(ROUTER_ROLE, fakeRouterCaller.address, 0)
      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 80001n,
        sender: abiCoder.encode(['address'], [otherSideCaller.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await mockBridge.lock(true)
      await ccipAdapter.ccipReceive(payload)
      await mockBridge.lock(false)

      await expect(ccipAdapter.manuallyExecuteMessages(10))
        .to.emit(ccipAdapter, 'ERC721Received')
        .withArgs(
          payload.sourceChainSelector,
          otherSideCaller.address,
          payload.data
        )
    })

    describe('Checks', () => {
      it('should revert if receive message from unknown caller', async function () {
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

        const payload: Client.Any2EVMMessageStruct = {
          messageId: ethers.encodeBytes32String('messsage_id'),
          sourceChainSelector: 80_001,
          sender: ethers.ZeroAddress,
          data: '0x',
          destTokenAmounts: []
        }

        await expect(
          ccipAdapter.connect(developer).ccipReceive(payload)
        ).to.be.revertedWithCustomError(
          ccipAdapter,
          'AccessManagedUnauthorized'
        )
      })

      it('should revert if execute manually when does not have any pending messages', async function () {
        const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

        const { mockCCIPRouterAddress } = await loadFixture(
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

        await expect(
          ccipAdapter.manuallyExecuteMessages(1)
        ).to.be.revertedWithCustomError(ccipAdapter, 'NoMessagesAvailable')
      })
    })
  })

  describe('Send message', () => {
    it('should send message to router', async function () {
      const [fakeBridgeCaller] = await getSigners()
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

      await accessManagement.grantRole(BRIDGE_ROLE, fakeBridgeCaller.address, 0)

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('sendMessageUsingNative').selector],
        BRIDGE_ROLE
      )

      const expectedAmount = 200_000
      await mockCCIPRouter.setFee(expectedAmount)

      const payload = {
        toChain: 80_001,
        receiver: ethers.ZeroAddress,
        data: '0x',
        gasLimit: 0
      }

      await expect(
        ccipAdapter.sendMessageUsingNative(payload, {
          value: expectedAmount
        })
      )
        .to.emit(ccipAdapter, 'ERC721Sent')
        .withArgs(payload.toChain, payload.receiver, payload.data)
    })

    it('should send message to router and pay fees as ERC20 token', async function () {
      const [fakeBridgeCaller] = await getSigners()
      const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)
      const { mockCCIPRouterAddress, mockCCIPRouter } = await loadFixture(
        deployMockCCIPRouterFixture
      )
      const { mockERC20, mockERC20Address } = await loadFixture(
        deployMockERC20Fixture
      )
      const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
        deployCCIPAdapterFixture.bind(
          this,
          mockBridgeAddress,
          accessManagementAddress,
          mockCCIPRouterAddress,
          mockERC20Address
        )
      )
      await accessManagement.grantRole(BRIDGE_ROLE, fakeBridgeCaller.address, 0)

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('sendMessageUsingERC20').selector],
        BRIDGE_ROLE
      )

      const expectedAmount = 200_000n
      await mockCCIPRouter.setFee(expectedAmount)

      const payload = {
        toChain: 80_001,
        receiver: ethers.ZeroAddress,
        data: '0x',
        gasLimit: 0
      }

      await mockERC20.approve(ccipAdapterAddress, expectedAmount)

      await expect(ccipAdapter.sendMessageUsingERC20(payload, expectedAmount))
        .to.emit(ccipAdapter, 'ERC721Sent')
        .withArgs(payload.toChain, payload.receiver, payload.data)
    })

    describe('Checks', () => {
      it('should revert if send message from unknown caller using native', async function () {
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

        const payload = {
          toChain: 80_001,
          receiver: ethers.ZeroAddress,
          data: '0x',
          gasLimit: 0
        }

        await expect(
          ccipAdapter.connect(developer).sendMessageUsingNative(payload)
        ).to.be.revertedWithCustomError(
          ccipAdapter,
          'AccessManagedUnauthorized'
        )
      })

      it('should revert if send message from unknown caller using erc20', async function () {
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

        const payload = {
          toChain: 80_001,
          receiver: ethers.ZeroAddress,
          data: '0x',
          gasLimit: 0
        }

        await expect(
          ccipAdapter.connect(developer).sendMessageUsingERC20(payload, 0)
        ).to.be.revertedWithCustomError(
          ccipAdapter,
          'AccessManagedUnauthorized'
        )
      })

      it('should revert if send message to router without native fee amount', async function () {
        const [fakeBridgeCaller] = await getSigners()

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

        await accessManagement.grantRole(
          BRIDGE_ROLE,
          fakeBridgeCaller.address,
          0
        )

        await accessManagement.setTargetFunctionRole(
          ccipAdapterAddress,
          [
            ccipAdapter.interface.getFunction('sendMessageUsingNative').selector
          ],
          BRIDGE_ROLE
        )

        const expectedAmount = 200_000
        await mockCCIPRouter.setFee(expectedAmount)

        await expect(
          ccipAdapter.sendMessageUsingNative(
            {
              toChain: 80_001,
              receiver: ethers.ZeroAddress,
              data: '0x',
              gasLimit: 0
            },
            {
              value: expectedAmount - 1
            }
          )
        ).to.be.revertedWithCustomError(
          ccipAdapter,
          'InsufficientFeeTokenAmount'
        )
      })

      it('should revert if send message to router without erc20 fee amount', async function () {
        const [fakeBridgeCaller] = await getSigners()

        const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

        const { mockCCIPRouterAddress, mockCCIPRouter } = await loadFixture(
          deployMockCCIPRouterFixture
        )

        const { mockERC20, mockERC20Address } = await loadFixture(
          deployMockERC20Fixture
        )

        const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
          deployCCIPAdapterFixture.bind(
            this,
            mockBridgeAddress,
            accessManagementAddress,
            mockCCIPRouterAddress,
            mockERC20Address
          )
        )

        await accessManagement.grantRole(
          BRIDGE_ROLE,
          fakeBridgeCaller.address,
          0
        )

        await accessManagement.setTargetFunctionRole(
          ccipAdapterAddress,
          [
            ccipAdapter.interface.getFunction('sendMessageUsingNative').selector
          ],
          BRIDGE_ROLE
        )

        const expectedAmount = 200_000
        await mockCCIPRouter.setFee(expectedAmount)

        await mockERC20.approve(ccipAdapterAddress, expectedAmount)

        await expect(
          ccipAdapter.sendMessageUsingERC20(
            {
              toChain: 80_001,
              receiver: ethers.ZeroAddress,
              data: '0x',
              gasLimit: 0
            },
            expectedAmount - 1
          )
        ).to.be.revertedWithCustomError(
          ccipAdapter,
          'InsufficientFeeTokenAmount'
        )
      })
    })
  })

  describe('Checks', () => {
    it('should revert on call transfer native tokens', async function () {
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
})