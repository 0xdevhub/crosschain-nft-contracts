import { expect } from 'chai'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { ethers } from 'hardhat'
import { deployAccessManagementFixture } from '@/test/accessManagement/fixtures'
import { AccessManagement } from '@/typechain/contracts/AccessManagement'
import { deployCCIPAdapterFixture } from './fixture'
import { time } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { abiCoder, getSigners } from '@/scripts/utils'
import { deployMockCCIPRouterFixture } from '@/test/mocks/ccipRouterFixture'
import { deployMockBridgeFixture } from '@/test/mocks/bridgeFixture'
import {
  BRIDGE_ROLE,
  BRIDGE_ROLE_DELAY,
  ROUTER_ROLE,
  ROUTER_ROLE_DELAY
} from '@/scripts/constants'
import { Client } from '@/typechain/contracts/adapters/CCIPAdapter'
import { deployMockERC20Fixture } from '@/test/mocks/erc20Fixture'

describe('CCIPAdapter', function () {
  let accessManagement: AccessManagement
  let accessManagementAddress: string

  beforeEach(async function () {
    const fixture = await loadFixture(deployAccessManagementFixture)
    accessManagement = fixture.accessManagement
    accessManagementAddress = fixture.accessManagementAddress
  })

  describe('Settings', () => {
    it('should return bridge address', async function () {
      const mockAdapterRouterAddres =
        '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'
      const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'

      const { ccipAdapter } = await loadFixture(
        deployCCIPAdapterFixture.bind(
          this,
          mockBridgeAddress,
          accessManagementAddress,
          mockAdapterRouterAddres
        )
      )

      const bridgeAddress = await ccipAdapter.getBridge()

      expect(bridgeAddress).to.be.equal(mockBridgeAddress)
    })

    it('should return adapter router address', async function () {
      const mockAdapterRouterAddres =
        '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'
      const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'

      const { ccipAdapter } = await loadFixture(
        deployCCIPAdapterFixture.bind(
          this,
          mockBridgeAddress,
          accessManagementAddress,
          mockAdapterRouterAddres
        )
      )

      const mockAdapterRouterAddress = await ccipAdapter.getRouter()

      expect(mockAdapterRouterAddress).to.be.equal(mockAdapterRouterAddres)
    })

    it('should return fee token as zero address if not set', async function () {
      const mockAdapterRouterAddres =
        '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'
      const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'

      const { ccipAdapter } = await loadFixture(
        deployCCIPAdapterFixture.bind(
          this,
          mockBridgeAddress,
          accessManagementAddress,
          mockAdapterRouterAddres
        )
      )

      const feeToken = await ccipAdapter.feeToken()

      expect(feeToken).to.be.equal(ethers.ZeroAddress)
    })

    it('should return fee token address if set', async function () {
      const mockAdapterRouterAddres =
        '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'
      const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'
      const mockFeeTokenAddress = '0xCE0e4e4D2Dc0033cE2dbc35855251F4F3D086D0A'

      const { ccipAdapter } = await loadFixture(
        deployCCIPAdapterFixture.bind(
          this,
          mockBridgeAddress,
          accessManagementAddress,
          mockAdapterRouterAddres,
          mockFeeTokenAddress
        )
      )

      const feeToken = await ccipAdapter.feeToken()

      expect(feeToken).to.be.equal(mockFeeTokenAddress)
    })

    it('should set update interval', async function () {
      const mockAdapterRouterAddres =
        '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'
      const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'

      const { ccipAdapter } = await loadFixture(
        deployCCIPAdapterFixture.bind(
          this,
          mockBridgeAddress,
          accessManagementAddress,
          mockAdapterRouterAddres
        )
      )

      const newInterval = 120

      await ccipAdapter.setUpdateInterval(newInterval)
      const updatedInterval = await ccipAdapter.updateInterval()

      expect(updatedInterval).to.be.equal(newInterval)
    })

    it('should set default execution limit', async function () {
      const mockAdapterRouterAddres =
        '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'
      const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'

      const { ccipAdapter } = await loadFixture(
        deployCCIPAdapterFixture.bind(
          this,
          mockBridgeAddress,
          accessManagementAddress,
          mockAdapterRouterAddres
        )
      )

      const newExecutionLimit = 10

      await ccipAdapter.setDefaultExecutionLimit(newExecutionLimit)

      const updatedExecutionLimit = await ccipAdapter.defaultExecutionLimit()

      expect(updatedExecutionLimit).to.be.equal(newExecutionLimit)
    })

    it('should return required fee amount for message', async function () {
      const { mockCCIPRouterAddress, mockCCIPRouter } = await loadFixture(
        deployMockCCIPRouterFixture
      )

      const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'

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

    describe('Checks', () => {
      it('should revert on call set update interval if sender not allowed', async function () {
        const mockAdapterRouterAddres =
          '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'

        const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'

        const { ccipAdapter } = await loadFixture(
          deployCCIPAdapterFixture.bind(
            this,
            mockBridgeAddress,
            accessManagementAddress,
            mockAdapterRouterAddres
          )
        )
        const [, hacker] = await getSigners()

        await expect(
          ccipAdapter.connect(hacker).setUpdateInterval(120)
        ).to.be.revertedWithCustomError(
          ccipAdapter,
          'AccessManagedUnauthorized'
        )
      })

      it('should revert on call set default execution limit if sender not allowed', async function () {
        const mockAdapterRouterAddres =
          '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'
        const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'

        const { ccipAdapter } = await loadFixture(
          deployCCIPAdapterFixture.bind(
            this,
            mockBridgeAddress,
            accessManagementAddress,
            mockAdapterRouterAddres
          )
        )

        const [, hacker] = await getSigners()

        await expect(
          ccipAdapter.connect(hacker).setDefaultExecutionLimit(10)
        ).to.be.revertedWithCustomError(
          ccipAdapter,
          'AccessManagedUnauthorized'
        )
      })
    })
  })

  describe('Receive messages', () => {
    it('should set as pending message on receive', async function () {
      const [, mockRouterCaller, fromOtherChainAdapter] = await getSigners()

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

      /**Grant role to router calling ccipReceive */
      await accessManagement.grantRole(
        ROUTER_ROLE,
        mockRouterCaller.address,
        ROUTER_ROLE_DELAY
      )

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 195185815885835825n,
        sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)

      const messageIndex = 0

      const pendingMessage = await ccipAdapter.getPendingMessage(messageIndex)

      expect(pendingMessage).to.be.deep.equal([
        payload.sourceChainSelector,
        fromOtherChainAdapter.address,
        payload.data
      ])
    })

    it('should execute message instead of set as pending if bridge didnt revert', async function () {
      const [, mockRouterCaller, fromOtherChainAdapter] = await getSigners()

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

      /**Grant role to router calling ccipReceive */
      await accessManagement.grantRole(
        ROUTER_ROLE,
        mockRouterCaller.address,
        ROUTER_ROLE_DELAY
      )

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 195185815885835825n,
        sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      /// @dev disable mock force revert
      await mockBridge.lock(false)

      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)

      const total = await ccipAdapter.getPendingMessagesToExecuteCount()

      expect(total).to.be.deep.equal(0n)
    })

    it('should increment execute messages count on receive', async function () {
      const [, mockRouterCaller, fromOtherChainAdapter] = await getSigners()

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

      /**Grant role to router calling ccipReceive */
      await accessManagement.grantRole(
        ROUTER_ROLE,
        mockRouterCaller.address,
        ROUTER_ROLE_DELAY
      )

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 195185815885835825n,
        sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)
      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)

      const count = await ccipAdapter.getPendingMessagesToExecuteCount()

      expect(count).to.be.equal(2)
    })

    it('should emit MessageReceived on receive message', async function () {
      const [, mockRouterCaller, fromOtherChainAdapter] = await getSigners()

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

      /**Grant role to router calling ccipReceive */
      await accessManagement.grantRole(
        ROUTER_ROLE,
        mockRouterCaller.address,
        ROUTER_ROLE_DELAY
      )

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 195185815885835825n,
        sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await expect(ccipAdapter.connect(mockRouterCaller).ccipReceive(payload))
        .to.emit(ccipAdapter, 'MessageReceived')
        .withArgs(
          payload.sourceChainSelector,
          fromOtherChainAdapter.address,
          payload.data
        )
    })

    describe('Checks', () => {
      it('should revert if get message from non existen index when list is empty', async function () {
        const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

        const mockCCIPRouterAddress =
          '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'

        const { ccipAdapter } = await loadFixture(
          deployCCIPAdapterFixture.bind(
            this,
            mockBridgeAddress,
            accessManagementAddress,
            mockCCIPRouterAddress
          )
        )

        await expect(
          ccipAdapter.getPendingMessage(1)
        ).to.be.revertedWithCustomError(ccipAdapter, 'NoMessagesAvailable')
      })

      it('should revert if get message from a non existen index when list is not empty', async function () {
        const [, mockRouterCaller, fromOtherChainAdapter] = await getSigners()

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

        /**Grant role to router calling ccipReceive */
        await accessManagement.grantRole(
          ROUTER_ROLE,
          mockRouterCaller.address,
          ROUTER_ROLE_DELAY
        )

        await accessManagement.setTargetFunctionRole(
          ccipAdapterAddress,
          [ccipAdapter.interface.getFunction('ccipReceive').selector],
          ROUTER_ROLE
        )

        const payload: Client.Any2EVMMessageStruct = {
          messageId: ethers.encodeBytes32String('messsage_id'),
          sourceChainSelector: 195185815885835825n,
          sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
          data: abiCoder.encode(['string'], ['hello']),
          destTokenAmounts: []
        }

        await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)

        await expect(
          ccipAdapter.getPendingMessage(1)
        ).to.be.revertedWithCustomError(ccipAdapter, 'NoMessagesAvailable')
      })

      it('should revert if caller is not router', async function () {
        const [, hacker, fromOtherChainAdapter] = await getSigners()

        const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'

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

        const payload: Client.Any2EVMMessageStruct = {
          messageId: ethers.encodeBytes32String('messsage_id'),
          sourceChainSelector: 195185815885835825n,
          sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
          data: abiCoder.encode(['string'], ['hello']),
          destTokenAmounts: []
        }

        await expect(
          ccipAdapter.connect(hacker).ccipReceive(payload)
        ).to.be.revertedWithCustomError(
          ccipAdapter,
          'AccessManagedUnauthorized'
        )
      })
    })
  })

  describe('Executing messages', () => {
    it('should execute pending message using pending list size instead of limit', async function () {
      const [, mockRouterCaller, fromOtherChainAdapter] = await getSigners()

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

      /**Grant role to router calling ccipReceive */
      await accessManagement.grantRole(
        ROUTER_ROLE,
        mockRouterCaller.address,
        ROUTER_ROLE_DELAY
      )

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 195185815885835825n,
        sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)
      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)

      await ccipAdapter.executeMessages(10)

      const pendingMessagesCount = await ccipAdapter.getMessagesExecutedCount()

      expect(pendingMessagesCount).to.be.equal(2)
    })

    it('should execute pending message using limit instead of list size', async function () {
      const [, mockRouterCaller, fromOtherChainAdapter] = await getSigners()

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

      /**Grant role to router calling ccipReceive */
      await accessManagement.grantRole(ROUTER_ROLE, mockRouterCaller.address, 0)

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 195185815885835825n,
        sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)
      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)

      await ccipAdapter.executeMessages(1)

      const pendingMessagesCount = await ccipAdapter.getMessagesExecutedCount()

      expect(pendingMessagesCount).to.be.equal(1)
    })

    it('should remove from pending messages after execution', async function () {
      const [, mockRouterCaller, fromOtherChainAdapter] = await getSigners()

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

      /**Grant role to router calling ccipReceive */
      await accessManagement.grantRole(ROUTER_ROLE, mockRouterCaller.address, 0)

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 195185815885835825n,
        sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)
      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)

      await mockBridge.lock(false)

      await ccipAdapter.executeMessages(1)

      await expect(
        ccipAdapter.getPendingMessage(1)
      ).to.be.revertedWithCustomError(ccipAdapter, 'NoMessagesAvailable')
    })

    describe('Checks', () => {
      it('should revert execute pending messages if it is empty', async function () {
        const [, mockRouterCaller] = await getSigners()

        const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'

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

        /**Grant role to router calling ccipReceive */
        await accessManagement.grantRole(
          ROUTER_ROLE,
          mockRouterCaller.address,
          0
        )

        await accessManagement.setTargetFunctionRole(
          ccipAdapterAddress,
          [ccipAdapter.interface.getFunction('ccipReceive').selector],
          ROUTER_ROLE
        )

        await expect(
          ccipAdapter.connect(mockRouterCaller).executeMessages(1)
        ).to.be.revertedWithCustomError(ccipAdapter, 'NoMessagesAvailable')
      })

      it('should revert execute message limit as zero', async function () {
        const [, mockRouterCaller] = await getSigners()

        const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'

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

        /**Grant role to router calling ccipReceive */
        await accessManagement.grantRole(
          ROUTER_ROLE,
          mockRouterCaller.address,
          0
        )

        await accessManagement.setTargetFunctionRole(
          ccipAdapterAddress,
          [ccipAdapter.interface.getFunction('ccipReceive').selector],
          ROUTER_ROLE
        )

        await expect(
          ccipAdapter.connect(mockRouterCaller).executeMessages(0)
        ).to.be.revertedWithCustomError(ccipAdapter, 'NoMessagesAvailable')
      })
    })
  })

  describe('Execute messages by automation', () => {
    it('should return false check upkeep is not due', async function () {
      const [, mockRouterCaller, fromOtherChainAdapter] = await getSigners()

      const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

      const { mockCCIPRouter, mockCCIPRouterAddress } = await loadFixture(
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

      /**Grant role to router calling ccipReceive */
      await accessManagement.grantRole(ROUTER_ROLE, mockRouterCaller.address, 0)

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      await mockCCIPRouter.setFee(200_000)

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 195185815885835825n,
        sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)
      await ccipAdapter.performUpkeep('0x')

      const performUpkeep = await ccipAdapter.checkUpkeep('0x')

      expect(performUpkeep).to.be.deep.equal([false, '0x'])
    })

    it('should return false check upkeep is due but no pending messages', async function () {
      const [, mockRouterCaller, fromOtherChainAdapter] = await getSigners()

      const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

      const { mockCCIPRouter, mockCCIPRouterAddress } = await loadFixture(
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

      /**Grant role to router calling ccipReceive */
      await accessManagement.grantRole(ROUTER_ROLE, mockRouterCaller.address, 0)

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      await mockCCIPRouter.setFee(200_000)

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 195185815885835825n,
        sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)
      await ccipAdapter.performUpkeep('0x')

      const performUpkeep = await ccipAdapter.checkUpkeep('0x')

      await time.increase(60 * 60 * 24 * 2)

      expect(performUpkeep).to.be.deep.equal([false, '0x'])
    })

    it('should return true check if upkeep is due and pending messages', async function () {
      const [, mockRouterCaller, fromOtherChainAdapter] = await getSigners()

      const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

      const { mockCCIPRouter, mockCCIPRouterAddress } = await loadFixture(
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

      /**Grant role to router calling ccipReceive */
      await accessManagement.grantRole(ROUTER_ROLE, mockRouterCaller.address, 0)

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      await mockCCIPRouter.setFee(200_000)

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 195185815885835825n,
        sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)
      await ccipAdapter.performUpkeep('0x')

      await time.increase(60 * 60 * 24 * 2)

      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)
      const performUpkeep = await ccipAdapter.checkUpkeep('0x')

      expect(performUpkeep).to.be.deep.equal([true, '0x'])
    })

    it('should update last timestamp when call perform upkeep', async function () {
      const [, mockRouterCaller, fromOtherChainAdapter] = await getSigners()

      const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

      const { mockCCIPRouter, mockCCIPRouterAddress } = await loadFixture(
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

      /**Grant role to router calling ccipReceive */
      await accessManagement.grantRole(ROUTER_ROLE, mockRouterCaller.address, 0)

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )
      await mockCCIPRouter.setFee(200_000)

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 195185815885835825n,
        sender: abiCoder.encode(['address'], [fromOtherChainAdapter.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }
      await ccipAdapter.connect(mockRouterCaller).ccipReceive(payload)
      await ccipAdapter.performUpkeep('0x')

      const lastTimeStamp = await ccipAdapter.getLastTimeStampPerformUpkeep()

      expect(lastTimeStamp).to.be.not.equal(0)
    })

    describe('Checks', () => {
      it('should revert if perform upkeep if pending messages is empty', async function () {
        const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'
        const mockCCIPRouterAddress =
          '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'

        const { ccipAdapter } = await loadFixture(
          deployCCIPAdapterFixture.bind(
            this,
            mockBridgeAddress,
            accessManagementAddress,
            mockCCIPRouterAddress
          )
        )

        await expect(
          ccipAdapter.performUpkeep('0x')
        ).to.be.revertedWithCustomError(ccipAdapter, 'NoMessagesAvailable')
      })
    })
  })

  describe('Send messages', () => {
    it('Should send message using ERC20 as fee token', async function () {
      const [, mockBridgeCaller, toOtherChainAdapter] = await getSigners()

      const { mockCCIPRouter, mockCCIPRouterAddress } = await loadFixture(
        deployMockCCIPRouterFixture
      )

      const expectedAmount = 200_000n

      const { mockERC20, mockERC20Address } = await loadFixture(
        deployMockERC20Fixture.bind(
          this,
          'erc20token',
          'erc20symbol',
          mockBridgeCaller.address,
          expectedAmount
        )
      )

      const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
        deployCCIPAdapterFixture.bind(
          this,
          mockBridgeCaller.address,
          accessManagementAddress,
          mockCCIPRouterAddress,
          mockERC20Address
        )
      )

      await accessManagement.grantRole(
        BRIDGE_ROLE,
        mockBridgeCaller.address,
        BRIDGE_ROLE_DELAY
      )

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('sendMessageUsingERC20').selector],
        BRIDGE_ROLE
      )

      await mockCCIPRouter.setFee(expectedAmount)

      const payload = {
        toChain: 80_001,
        receiver: toOtherChainAdapter.address,
        data: '0x',
        gasLimit: 0
      }

      await mockERC20
        .connect(mockBridgeCaller)
        .approve(ccipAdapterAddress, expectedAmount)

      await expect(
        ccipAdapter
          .connect(mockBridgeCaller)
          .sendMessageUsingERC20(payload, expectedAmount)
      )
        .to.emit(ccipAdapter, 'MessageSent')
        .withArgs(payload.toChain, payload.receiver, payload.data)
    })

    it('Should send message using native token as fee token', async function () {
      const [, mockBridgeCaller, toOtherChainAdapter] = await getSigners()

      const { mockCCIPRouter, mockCCIPRouterAddress } = await loadFixture(
        deployMockCCIPRouterFixture
      )

      const expectedAmount = 200_000n

      const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
        deployCCIPAdapterFixture.bind(
          this,
          mockBridgeCaller.address,
          accessManagementAddress,
          mockCCIPRouterAddress
        )
      )

      await accessManagement.grantRole(
        BRIDGE_ROLE,
        mockBridgeCaller.address,
        BRIDGE_ROLE_DELAY
      )

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('sendMessageUsingNative').selector],
        BRIDGE_ROLE
      )

      await mockCCIPRouter.setFee(expectedAmount)

      const payload = {
        toChain: 80_001,
        receiver: toOtherChainAdapter.address,
        data: '0x',
        gasLimit: 0
      }

      await expect(
        ccipAdapter.connect(mockBridgeCaller).sendMessageUsingNative(payload, {
          value: expectedAmount
        })
      )
        .to.emit(ccipAdapter, 'MessageSent')
        .withArgs(payload.toChain, payload.receiver, payload.data)
    })

    describe('Checks', () => {
      it('should revert on send message using ERC20 if sender not allowed', async function () {
        const [, hacker] = await getSigners()

        const mockCCIPRouterAddress =
          '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'
        const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'
        const mockERC20Address = '0xCE0e4e4D2Dc0033cE2dbc35855251F4F3D086D0A'
        const expectedAmount = 200_000n

        const { ccipAdapter } = await loadFixture(
          deployCCIPAdapterFixture.bind(
            this,
            mockBridgeAddress,
            accessManagementAddress,
            mockCCIPRouterAddress,
            mockERC20Address
          )
        )

        const payload = {
          toChain: 80_001,
          receiver: ethers.ZeroAddress,
          data: '0x',
          gasLimit: 0
        }

        await expect(
          ccipAdapter
            .connect(hacker)
            .sendMessageUsingERC20(payload, expectedAmount)
        ).to.be.revertedWithCustomError(
          ccipAdapter,
          'AccessManagedUnauthorized'
        )
      })

      it('should revert on send message using native token if sender not allowed', async function () {
        const [, hacker] = await getSigners()

        const mockCCIPRouterAddress =
          '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'
        const mockBridgeAddress = '0xEF324FB84e72F098363837dF92C7aFfF46675411'
        const mockERC20Address = '0xCE0e4e4D2Dc0033cE2dbc35855251F4F3D086D0A'
        const expectedAmount = 200_000n

        const { ccipAdapter } = await loadFixture(
          deployCCIPAdapterFixture.bind(
            this,
            mockBridgeAddress,
            accessManagementAddress,
            mockCCIPRouterAddress,
            mockERC20Address
          )
        )

        const payload = {
          toChain: 80_001,
          receiver: ethers.ZeroAddress,
          data: '0x',
          gasLimit: 0
        }

        await expect(
          ccipAdapter.connect(hacker).sendMessageUsingNative(payload, {
            value: expectedAmount
          })
        ).to.be.revertedWithCustomError(
          ccipAdapter,
          'AccessManagedUnauthorized'
        )
      })

      it('should revert if send message without enough amount using ERC20', async function () {
        const [, mockBridgeCaller, toOtherChainAdapter] = await getSigners()

        const { mockCCIPRouter, mockCCIPRouterAddress } = await loadFixture(
          deployMockCCIPRouterFixture
        )

        const expectedAmount = 200_000n

        const { mockERC20, mockERC20Address } = await loadFixture(
          deployMockERC20Fixture.bind(
            this,
            'erc20token',
            'erc20symbol',
            mockBridgeCaller.address,
            expectedAmount
          )
        )

        const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
          deployCCIPAdapterFixture.bind(
            this,
            mockBridgeCaller.address,
            accessManagementAddress,
            mockCCIPRouterAddress,
            mockERC20Address
          )
        )

        await accessManagement.grantRole(
          BRIDGE_ROLE,
          mockBridgeCaller.address,
          BRIDGE_ROLE_DELAY
        )

        await accessManagement.setTargetFunctionRole(
          ccipAdapterAddress,
          [ccipAdapter.interface.getFunction('sendMessageUsingERC20').selector],
          BRIDGE_ROLE
        )

        await mockCCIPRouter.setFee(expectedAmount)

        const payload = {
          toChain: 80_001,
          receiver: toOtherChainAdapter.address,
          data: '0x',
          gasLimit: 0
        }

        await mockERC20
          .connect(mockBridgeCaller)
          .approve(ccipAdapterAddress, expectedAmount)

        await expect(
          ccipAdapter
            .connect(mockBridgeCaller)
            .sendMessageUsingERC20(payload, expectedAmount - 1n)
        ).to.be.revertedWithCustomError(
          ccipAdapter,
          'InsufficientFeeTokenAmount'
        )
      })

      it('should revert if send message without enough amount using native token', async function () {
        const [, mockBridgeCaller, toOtherChainAdapter] = await getSigners()

        const { mockCCIPRouter, mockCCIPRouterAddress } = await loadFixture(
          deployMockCCIPRouterFixture
        )

        const expectedAmount = 200_000n

        const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
          deployCCIPAdapterFixture.bind(
            this,
            mockBridgeCaller.address,
            accessManagementAddress,
            mockCCIPRouterAddress
          )
        )

        await accessManagement.grantRole(
          BRIDGE_ROLE,
          mockBridgeCaller.address,
          BRIDGE_ROLE_DELAY
        )

        await accessManagement.setTargetFunctionRole(
          ccipAdapterAddress,
          [
            ccipAdapter.interface.getFunction('sendMessageUsingNative').selector
          ],
          BRIDGE_ROLE
        )

        await mockCCIPRouter.setFee(expectedAmount)

        const payload = {
          toChain: 80_001,
          receiver: toOtherChainAdapter.address,
          data: '0x',
          gasLimit: 0
        }

        await expect(
          ccipAdapter
            .connect(mockBridgeCaller)
            .sendMessageUsingNative(payload, {
              value: expectedAmount - 1n
            })
        ).to.be.revertedWithCustomError(
          ccipAdapter,
          'InsufficientFeeTokenAmount'
        )
      })
    })
  })

  describe('Checks', () => {
    it('should revert on call transfer native tokens', async function () {
      const [hacker] = await getSigners()

      const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

      const mockAdapterRouterAddress =
        '0x00000000000000000000000000000000000000D2'

      const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
        deployCCIPAdapterFixture.bind(
          this,
          mockBridgeAddress,
          accessManagementAddress,
          mockAdapterRouterAddress
        )
      )

      expect(
        hacker.sendTransaction({
          to: ccipAdapterAddress,
          value: 100_000
        })
      ).to.be.revertedWithCustomError(ccipAdapter, 'DepositNotAllowed')
    })

    it('should revert on call fallback function', async function () {
      const [hacker] = await getSigners()

      const { mockBridgeAddress } = await loadFixture(deployMockBridgeFixture)

      const mockAdapterRouterAddress =
        '0x00000000000000000000000000000000000000D2'

      const { ccipAdapter, ccipAdapterAddress } = await loadFixture(
        deployCCIPAdapterFixture.bind(
          this,
          mockBridgeAddress,
          accessManagementAddress,
          mockAdapterRouterAddress
        )
      )

      const notExistentFunctionSignature = abiCoder.encode(
        ['bytes4'],
        ['0x00000000']
      )

      expect(
        hacker.sendTransaction({
          to: ccipAdapterAddress,
          data: notExistentFunctionSignature
        })
      ).to.be.revertedWithCustomError(ccipAdapter, 'FallbackNotAllowed')
    })
  })
})
