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
import { ROUTER_ROLE } from '@/scripts/constants'
import { Client } from '@/typechain/contracts/adapters/CCIPAdapter'

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

  describe('Send message ERC20 token', () => {
    it('should registry message as pending on receive message', async function () {
      const [mockRouterCaller, otherSideCaller] = await getSigners()

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

      await accessManagement.grantRole(ROUTER_ROLE, mockRouterCaller.address, 0)

      await accessManagement.setTargetFunctionRole(
        ccipAdapterAddress,
        [ccipAdapter.interface.getFunction('ccipReceive').selector],
        ROUTER_ROLE
      )

      const payload: Client.Any2EVMMessageStruct = {
        messageId: ethers.encodeBytes32String('messsage_id'),
        sourceChainSelector: 195185815885835825n,
        sender: abiCoder.encode(['address'], [otherSideCaller.address]),
        data: abiCoder.encode(['string'], ['hello']),
        destTokenAmounts: []
      }

      await ccipAdapter.ccipReceive(payload)

      const messageIndex = 0

      const pendingMessage = await ccipAdapter.getPendingMessage(messageIndex)

      expect(pendingMessage).to.be.deep.equal([
        payload.sourceChainSelector,
        otherSideCaller.address,
        payload.data
      ])
    })

    it('should emit ERC721Received')
  })

  describe('Send message native token', () => {})

  describe('Executing messages', () => {})

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
