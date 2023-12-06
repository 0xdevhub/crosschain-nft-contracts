import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { AccessManagement } from '@/typechain/contracts/AccessManagement'
import { deployAccessManagementFixture } from '@/test/accessManagement/fixtures'
import { RampType, deployBridgeFixture } from './fixture'
import { deployMockERC721Fixture } from '@/test/mocks/erc721Fixture'
import { deployMockAdapterFixture } from '@/test/mocks/adapterFixture'
import { deployMockContractGeneralFixture } from '@/test/mocks/commonFixture'
import { abiCoder, getSigners } from '@/scripts/utils'
import { ethers } from 'hardhat'
import { ADAPTER_ROLE, ADAPTER_ROLE_DELAY } from '@/scripts/constants'
import { deployMockERC20Fixture } from '../mocks/erc20Fixture'

describe('Bridge', function () {
  let accessManagement: AccessManagement
  let accessManagementAddress: string

  beforeEach(async function () {
    // initialize access management fixture
    const fixture = await loadFixture(deployAccessManagementFixture)
    accessManagement = fixture.accessManagement
    accessManagementAddress = fixture.accessManagementAddress
  })

  describe('Settings', () => {
    it('should deployed chain id', async function () {
      const deployedChainId = 1

      const { bridge } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress, deployedChainId)
      )

      const chainId = await bridge.chainId()

      expect(chainId).to.be.equal(deployedChainId)
    })

    it('should set chain settings by evm chain id', async function () {
      const adapterAddress = '0x00000000000000000000000000000000000000f9'

      const { bridge } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress)
      )

      const evmChainId = 1
      const nonEvmChainId = 805125132001
      const isEnabled = true

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        adapterAddress,
        RampType.OnRamp,
        isEnabled,
        0n
      )

      const adapter = await bridge.getChainSettings(evmChainId, RampType.OnRamp)

      expect(adapter).to.deep.equal([
        evmChainId,
        nonEvmChainId,
        adapterAddress,
        isEnabled,
        RampType.OnRamp
      ])
    })

    it('should emit EvmChainSettingsSet event', async function () {
      const adapterAddress = '0x00000000000000000000000000000000000000f9'

      const { bridge } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress)
      )

      const evmChainId = 1
      const nonEvmChainId = 805125132001
      const isEnabled = true

      await expect(
        bridge.setChainSetting(
          evmChainId,
          nonEvmChainId,
          adapterAddress,
          RampType.OnRamp,
          isEnabled,
          0n
        )
      ).to.emit(bridge, 'EvmChainSettingsSet')
    })

    it('should set ERC721 wrapped token', async function () {
      const wrappedAddress = '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'
      const originAddress = '0xCE0e4e4D2Dc0033cE2dbc35855251F4F3D086D0A'
      const originEvmChainId = 1
      const { bridge } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress)
      )

      await bridge.setERC721WrappedToken(
        wrappedAddress,
        originEvmChainId,
        originAddress
      )

      const wrappedToken = await bridge.getERC721WrappedToken(originAddress)

      expect(wrappedToken).to.deep.equal([
        originEvmChainId,
        originAddress,
        wrappedAddress
      ])
    })

    describe('Checks', () => {
      it('should revert set chain settings if not allowed', async function () {
        const [, hacker] = await getSigners()
        const adapterAddress = '0x00000000000000000000000000000000000000f9'

        const { bridge } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 1
        const nonEvmChainId = 805125132001
        const isEnabled = true

        await expect(
          bridge
            .connect(hacker)
            .setChainSetting(
              evmChainId,
              nonEvmChainId,
              adapterAddress,
              RampType.OnRamp,
              isEnabled,
              0n
            )
        ).to.be.revertedWithCustomError(bridge, 'AccessManagedUnauthorized')
      })

      it('should revert set ERC721 wrapped token if not allowed', async function () {
        const [, hacker] = await getSigners()
        const wrappedAddress = '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'
        const originAddress = '0xCE0e4e4D2Dc0033cE2dbc35855251F4F3D086D0A'
        const originEvmChainId = 1
        const { bridge } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        await expect(
          bridge
            .connect(hacker)
            .setERC721WrappedToken(
              wrappedAddress,
              originEvmChainId,
              originAddress
            )
        ).to.be.revertedWithCustomError(bridge, 'AccessManagedUnauthorized')
      })
    })
  })

  describe('Send ERC721 using ERC20', () => {
    it('should transfer and hold ERC721 on send if not wrapped', async function () {
      const evmChainId = 137

      const { mockERC721, mockERC721Address } = await loadFixture(
        deployMockERC721Fixture
      )

      const { mockERC20, mockERC20Address } = await loadFixture(
        deployMockERC20Fixture
      )

      const { bridge, bridgeAddress } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
      )

      const nonEvmChainId = 12334124515
      const isEnabled = true

      const { mockAdapter, mockAdapterAddress } = await loadFixture(
        deployMockAdapterFixture
      )

      await mockAdapter.setFeeToken(mockERC20Address)

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress,
        RampType.OnRamp,
        isEnabled,
        0n
      )

      const expectedAmount = 100_000n
      await mockAdapter.setFee(expectedAmount)

      const tokenId = 1
      await mockERC721.mint(tokenId)
      await mockERC721.approve(bridgeAddress, tokenId)
      await mockERC20.approve(bridgeAddress, expectedAmount)

      await bridge.sendERC721UsingERC20(
        evmChainId,
        mockERC721Address,
        tokenId,
        expectedAmount
      )

      const ERC721Owner = await mockERC721.ownerOf(tokenId)
      expect(ERC721Owner).to.be.equal(bridgeAddress)
    })

    it('should transfer and burn ERC721 on send ERC721 if its wrapped', async function () {
      const localEvmChainId = 137
      const [currentOwner] = await getSigners()

      const { mockERC721, mockERC721Address } = await loadFixture(
        deployMockERC721Fixture
      )

      const { mockERC20, mockERC20Address } = await loadFixture(
        deployMockERC20Fixture
      )

      const { bridge, bridgeAddress } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress, localEvmChainId)
      )

      const evmChainId = 1
      const nonEvmChainId = 123456789
      const isEnabled = true

      const { mockAdapterAddress, mockAdapter } = await loadFixture(
        deployMockAdapterFixture
      )

      await mockAdapter.setFeeToken(mockERC20Address)
      const expectedAmount = 100_000n
      await mockAdapter.setFee(expectedAmount)

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress, // source
        RampType.OnRamp,
        isEnabled,
        0n
      )

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress, // source
        RampType.OffRamp,
        isEnabled,
        0n
      )

      const tokenId = 1
      await mockERC721.mint(tokenId)

      /// grant role to bridge contract
      await accessManagement.grantRole(
        ADAPTER_ROLE,
        mockAdapterAddress,
        ADAPTER_ROLE_DELAY
      )

      /// grant function role  to bridge contract
      await accessManagement.setTargetFunctionRole(
        bridgeAddress,
        [bridge.interface.getFunction('receiveERC721').selector],
        ADAPTER_ROLE
      )

      const encodedData = abiCoder.encode(
        ['address', 'bytes', 'bytes'],
        [
          currentOwner.address,
          abiCoder.encode(
            ['uint256', 'address', 'uint256'],
            [evmChainId, mockERC721Address, tokenId]
          ),
          abiCoder.encode(
            ['string', 'string', 'string'],
            [
              await mockERC721.name(),
              await mockERC721.symbol(),
              await mockERC721.tokenURI(tokenId)
            ]
          )
        ]
      )

      const payload = {
        fromChain: nonEvmChainId,
        sender: mockAdapterAddress,
        data: encodedData
      }

      const tx = await mockAdapter.receiveMessage(payload, bridgeAddress)
      const receipt = await tx.wait()
      const filter = bridge.filters.ERC721WrappedCreated
      const logs = await bridge.queryFilter(filter, receipt?.blockHash)

      const [, , wrappedTokenAddress] = logs[0].args

      const wrappedToken = await ethers.getContractAt(
        'WERC721',
        wrappedTokenAddress
      )

      await wrappedToken.approve(bridgeAddress, tokenId)
      await mockERC20.approve(bridgeAddress, expectedAmount)

      const tx2 = await bridge.sendERC721UsingERC20(
        evmChainId,
        wrappedTokenAddress,
        tokenId,
        expectedAmount
      )

      await tx2.wait()

      await expect(wrappedToken.ownerOf(tokenId)).to.be.revertedWithCustomError(
        wrappedToken,
        'ERC721NonexistentToken'
      )
    })

    it('should emit ERC721Sent event', async function () {
      const evmChainId = 137

      const { mockERC721, mockERC721Address } = await loadFixture(
        deployMockERC721Fixture
      )

      const { mockERC20, mockERC20Address } = await loadFixture(
        deployMockERC20Fixture
      )

      const { bridge, bridgeAddress } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
      )

      const nonEvmChainId = 12334124515
      const isEnabled = true

      const { mockAdapter, mockAdapterAddress } = await loadFixture(
        deployMockAdapterFixture
      )

      await mockAdapter.setFeeToken(mockERC20Address)

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress,
        RampType.OnRamp,
        isEnabled,
        0n
      )

      const expectedAmount = 100_000n
      await mockAdapter.setFee(expectedAmount)

      const tokenId = 1
      await mockERC721.mint(tokenId)
      await mockERC721.approve(bridgeAddress, tokenId)
      await mockERC20.approve(bridgeAddress, expectedAmount)

      await expect(
        bridge.sendERC721UsingERC20(
          evmChainId,
          mockERC721Address,
          tokenId,
          expectedAmount
        )
      ).to.emit(bridge, 'ERC721Sent')
    })

    describe('Checks', () => {
      it('should revert if the amount sent as fee token is insufficient ', async function () {
        const { mockERC721, mockERC721Address } = await loadFixture(
          deployMockERC721Fixture
        )

        const { mockERC20, mockERC20Address } = await loadFixture(
          deployMockERC20Fixture
        )

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 1
        const nonEvmChainId = 12334124515
        const isEnabled = true

        const { mockAdapter, mockAdapterAddress } = await loadFixture(
          deployMockAdapterFixture
        )

        await mockAdapter.setFeeToken(mockERC20Address)

        await bridge.setChainSetting(
          evmChainId,
          nonEvmChainId,
          mockAdapterAddress,
          RampType.OnRamp,
          isEnabled,
          0n
        )

        const expectedAmount = 100_000n
        await mockAdapter.setFee(expectedAmount)

        const tokenId = 1
        await mockERC721.mint(tokenId)
        await mockERC721.approve(bridgeAddress, tokenId)
        await mockERC20.approve(bridgeAddress, expectedAmount)

        await expect(
          bridge.sendERC721UsingERC20(
            evmChainId,
            mockERC721Address,
            tokenId,
            expectedAmount - 1n
          )
        ).to.be.revertedWithCustomError(bridge, 'InsufficientFeeTokenAmount')
      })

      it('should revert if call send ERC721 using native if adapter is ERC20', async function () {
        const evmChainId = 137

        const { mockERC721Address, mockERC721 } = await loadFixture(
          deployMockERC721Fixture
        )

        const { mockERC20Address } = await loadFixture(deployMockERC20Fixture)

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
        )

        const nonEvmChainId = 12334124515
        const isEnabled = true

        const { mockAdapterAddress, mockAdapter } = await loadFixture(
          deployMockAdapterFixture
        )

        await mockAdapter.setFeeToken(mockERC20Address)
        const expectedAmount = 100_000n
        await mockAdapter.setFee(expectedAmount)

        await bridge.setChainSetting(
          evmChainId,
          nonEvmChainId,
          mockAdapterAddress,
          RampType.OnRamp,
          isEnabled,
          0n
        )

        const tokenId = 1
        await mockERC721.mint(tokenId)
        await mockERC721.approve(bridgeAddress, tokenId)

        await expect(
          bridge.sendERC721UsingNative(evmChainId, mockERC721Address, tokenId, {
            value: expectedAmount
          })
        ).to.be.revertedWithCustomError(bridge, 'OperationNotSupported')
      })

      it('should revert if adapter on ramp is not set', async function () {
        const evmChainId = 137

        const mockERC20Address = '0xF903ba9E006193c1527BfBe65fe2123704EA3F99'
        const { mockERC721, mockERC721Address } = await loadFixture(
          deployMockERC721Fixture
        )

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
        )

        const { mockAdapter } = await loadFixture(deployMockAdapterFixture)

        await mockAdapter.setFeeToken(mockERC20Address)
        const expectedAmount = 100_000
        await mockAdapter.setFee(expectedAmount)

        const tokenId = 1
        await mockERC721.mint(tokenId)
        await mockERC721.approve(bridgeAddress, tokenId)

        await expect(
          bridge.sendERC721UsingERC20(
            evmChainId,
            mockERC721Address,
            tokenId,
            expectedAmount
          )
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotFound')
      })

      it('should revert if adapter on ramp is not enabled', async function () {
        const evmChainId = 137

        const { mockERC721, mockERC721Address } = await loadFixture(
          deployMockERC721Fixture
        )

        const { mockERC20, mockERC20Address } = await loadFixture(
          deployMockERC20Fixture
        )

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
        )

        const nonEvmChainId = 12334124515
        const isEnabled = false

        const { mockAdapter, mockAdapterAddress } = await loadFixture(
          deployMockAdapterFixture
        )

        await mockAdapter.setFeeToken(mockERC20Address)

        await bridge.setChainSetting(
          evmChainId,
          nonEvmChainId,
          mockAdapterAddress,
          RampType.OnRamp,
          isEnabled,
          0n
        )

        const expectedAmount = 100_000n
        await mockAdapter.setFee(expectedAmount)

        const tokenId = 1
        await mockERC721.mint(tokenId)
        await mockERC721.approve(bridgeAddress, tokenId)
        await mockERC20.approve(bridgeAddress, expectedAmount)

        await expect(
          bridge.sendERC721UsingERC20(
            evmChainId,
            mockERC721Address,
            tokenId,
            expectedAmount
          )
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotEnabled')
      })
    })
  })

  describe('Send ERC721 using Native', () => {
    it('should transfer and hold ERC721 on send if not wrapped', async function () {
      const evmChainId = 137

      const { mockERC721, mockERC721Address } = await loadFixture(
        deployMockERC721Fixture
      )

      const { bridge, bridgeAddress } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
      )

      const nonEvmChainId = 12334124515
      const isEnabled = true

      const { mockAdapter, mockAdapterAddress } = await loadFixture(
        deployMockAdapterFixture
      )

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress,
        RampType.OnRamp,
        isEnabled,
        0n
      )

      const expectedAmount = 100_000
      await mockAdapter.setFee(expectedAmount)

      const tokenId = 1
      await mockERC721.mint(tokenId)
      await mockERC721.approve(bridgeAddress, tokenId)

      await bridge.sendERC721UsingNative(
        evmChainId,
        mockERC721Address,
        tokenId,
        {
          value: expectedAmount
        }
      )

      const ERC721Owner = await mockERC721.ownerOf(tokenId)
      expect(ERC721Owner).to.be.equal(bridgeAddress)
    })

    it('should transfer and burn ERC721 on send ERC721 if its wrapped', async function () {
      const [currentOwner] = await getSigners()

      const { mockERC721, mockERC721Address } = await loadFixture(
        deployMockERC721Fixture
      )

      const localEvmChainId = 137

      const { bridge, bridgeAddress } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress, localEvmChainId)
      )

      const evmChainId = 1
      const nonEvmChainId = 123456789
      const isEnabled = true

      const { mockAdapterAddress, mockAdapter } = await loadFixture(
        deployMockAdapterFixture
      )

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress, // source
        RampType.OnRamp,
        isEnabled,
        0n
      )

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress, // destination
        RampType.OffRamp,
        isEnabled,
        0n
      )

      const tokenId = 1
      await mockERC721.mint(tokenId)

      /// grant role to bridge contract
      await accessManagement.grantRole(
        ADAPTER_ROLE,
        mockAdapterAddress,
        ADAPTER_ROLE_DELAY
      )

      /// grant function role  to bridge contract
      await accessManagement.setTargetFunctionRole(
        bridgeAddress,
        [bridge.interface.getFunction('receiveERC721').selector],
        ADAPTER_ROLE
      )

      const encodedData = abiCoder.encode(
        ['address', 'bytes', 'bytes'],
        [
          currentOwner.address,
          abiCoder.encode(
            ['uint256', 'address', 'uint256'],
            [evmChainId, mockERC721Address, tokenId]
          ),
          abiCoder.encode(
            ['string', 'string', 'string'],
            [
              await mockERC721.name(),
              await mockERC721.symbol(),
              await mockERC721.tokenURI(tokenId)
            ]
          )
        ]
      )

      const payload = {
        fromChain: nonEvmChainId,
        sender: mockAdapterAddress,
        data: encodedData
      }

      const tx = await mockAdapter.receiveMessage(payload, bridgeAddress)
      const receipt = await tx.wait()
      const filter = bridge.filters.ERC721WrappedCreated
      const logs = await bridge.queryFilter(filter, receipt?.blockHash)

      const [, , wrappedTokenAddress] = logs[0].args

      const wrappedToken = await ethers.getContractAt(
        'WERC721',
        wrappedTokenAddress
      )

      await wrappedToken.approve(bridgeAddress, tokenId)

      const tx2 = await bridge.sendERC721UsingNative(
        evmChainId,
        wrappedTokenAddress,
        tokenId
      )

      await tx2.wait()

      await expect(wrappedToken.ownerOf(tokenId)).to.be.revertedWithCustomError(
        wrappedToken,
        'ERC721NonexistentToken'
      )
    })

    it('should emit ERC721Sent event', async function () {
      const evmChainId = 137

      const { mockERC721, mockERC721Address } = await loadFixture(
        deployMockERC721Fixture
      )

      const { bridge, bridgeAddress } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
      )

      const nonEvmChainId = 12334124515
      const isEnabled = true

      const { mockAdapter, mockAdapterAddress } = await loadFixture(
        deployMockAdapterFixture
      )

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress,
        RampType.OnRamp,
        isEnabled,
        0n
      )

      const expectedAmount = 100_000
      await mockAdapter.setFee(expectedAmount)

      const tokenId = 1
      await mockERC721.mint(tokenId)
      await mockERC721.approve(bridgeAddress, tokenId)

      await expect(
        bridge.sendERC721UsingNative(evmChainId, mockERC721Address, tokenId, {
          value: expectedAmount
        })
      ).to.emit(bridge, 'ERC721Sent')
    })

    describe('Checks', () => {
      it('should revert if the amount sent as fee token is insufficient', async function () {
        const evmChainId = 137

        const { mockERC721, mockERC721Address } = await loadFixture(
          deployMockERC721Fixture
        )

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
        )

        const nonEvmChainId = 12334124515
        const isEnabled = true

        const { mockAdapter, mockAdapterAddress } = await loadFixture(
          deployMockAdapterFixture
        )

        await bridge.setChainSetting(
          evmChainId,
          nonEvmChainId,
          mockAdapterAddress,
          RampType.OnRamp,
          isEnabled,
          0n
        )

        const expectedAmount = 100_000
        await mockAdapter.setFee(expectedAmount)

        const tokenId = 1
        await mockERC721.mint(tokenId)
        await mockERC721.approve(bridgeAddress, tokenId)

        await expect(
          bridge.sendERC721UsingNative(evmChainId, mockERC721Address, tokenId, {
            value: expectedAmount - 1
          })
        ).to.be.revertedWithCustomError(bridge, 'InsufficientFeeTokenAmount')
      })

      it('should revert if call send ERC721 using ERC20 if adapter is native', async function () {
        const evmChainId = 137

        const { mockERC721Address, mockERC721 } = await loadFixture(
          deployMockERC721Fixture
        )

        const { mockERC20 } = await loadFixture(deployMockERC20Fixture)

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
        )

        const nonEvmChainId = 12334124515
        const isEnabled = true

        const { mockAdapterAddress, mockAdapter } = await loadFixture(
          deployMockAdapterFixture
        )

        const expectedAmount = 100_000n
        await mockAdapter.setFee(expectedAmount)

        await bridge.setChainSetting(
          evmChainId,
          nonEvmChainId,
          mockAdapterAddress,
          RampType.OnRamp,
          isEnabled,
          0n
        )

        const tokenId = 1
        await mockERC721.mint(tokenId)
        await mockERC721.approve(bridgeAddress, tokenId)
        await mockERC20.approve(bridgeAddress, expectedAmount)

        await expect(
          bridge.sendERC721UsingERC20(
            evmChainId,
            mockERC721Address,
            tokenId,
            expectedAmount
          )
        ).to.be.revertedWithCustomError(bridge, 'OperationNotSupported')
      })

      it('should revert if adapter on ramp is not set', async function () {
        const evmChainId = 137

        const { mockERC721, mockERC721Address } = await loadFixture(
          deployMockERC721Fixture
        )

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
        )

        const { mockAdapter } = await loadFixture(deployMockAdapterFixture)

        const expectedAmount = 100_000
        await mockAdapter.setFee(expectedAmount)

        const tokenId = 1
        await mockERC721.mint(tokenId)
        await mockERC721.approve(bridgeAddress, tokenId)

        await expect(
          bridge.sendERC721UsingNative(evmChainId, mockERC721Address, tokenId, {
            value: expectedAmount
          })
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotFound')
      })

      it('should revert if adapter on ramp is not enabled', async function () {
        const evmChainId = 137

        const { mockERC721, mockERC721Address } = await loadFixture(
          deployMockERC721Fixture
        )

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
        )

        const nonEvmChainId = 12334124515
        const isEnabled = false

        const { mockAdapter, mockAdapterAddress } = await loadFixture(
          deployMockAdapterFixture
        )

        await bridge.setChainSetting(
          evmChainId,
          nonEvmChainId,
          mockAdapterAddress,
          RampType.OnRamp,
          isEnabled,
          0n
        )

        const expectedAmount = 100_000
        await mockAdapter.setFee(expectedAmount)

        const tokenId = 1
        await mockERC721.mint(tokenId)
        await mockERC721.approve(bridgeAddress, tokenId)

        await expect(
          bridge.sendERC721UsingNative(evmChainId, mockERC721Address, tokenId, {
            value: expectedAmount
          })
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotEnabled')
      })
    })
  })

  describe('Receive ERC721', () => {
    it('should transfer to receiver ERC721 wrapped token', async function () {
      const [, currentOwner] = await getSigners()

      const { mockERC721, mockERC721Address } = await loadFixture(
        deployMockERC721Fixture
      )
      const { bridge, bridgeAddress } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress)
      )

      const evmChainId = 1
      const nonEvmChainId = 123456789
      const isEnabled = true

      const { mockAdapterAddress, mockAdapter } = await loadFixture(
        deployMockAdapterFixture
      )

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress,
        RampType.OffRamp,
        isEnabled,
        0n
      )

      const tokenId = 1
      await mockERC721.mint(tokenId)

      /// grant role to bridge contract
      await accessManagement.grantRole(
        ADAPTER_ROLE,
        mockAdapterAddress,
        ADAPTER_ROLE_DELAY
      )

      /// grant function role  to bridge contract
      await accessManagement.setTargetFunctionRole(
        bridgeAddress,
        [bridge.interface.getFunction('receiveERC721').selector],
        ADAPTER_ROLE
      )

      const encodedData = abiCoder.encode(
        ['address', 'bytes', 'bytes'],
        [
          currentOwner.address,
          abiCoder.encode(
            ['uint256', 'address', 'uint256'],
            [evmChainId, mockERC721Address, tokenId]
          ),
          abiCoder.encode(
            ['string', 'string', 'string'],
            [
              await mockERC721.name(),
              await mockERC721.symbol(),
              await mockERC721.tokenURI(tokenId)
            ]
          )
        ]
      )

      const payload = {
        fromChain: nonEvmChainId,
        sender: mockAdapterAddress,
        data: encodedData
      }

      const tx = await mockAdapter.receiveMessage(payload, bridgeAddress)
      const receipt = await tx.wait()
      const filter = bridge.filters.ERC721WrappedCreated
      const logs = await bridge.queryFilter(filter, receipt?.blockHash)
      const [, , wrappedTokenAddress] = logs[0].args

      const wrappedToken = await ethers.getContractAt(
        'ERC721',
        wrappedTokenAddress
      )

      const wrappedTokenOwner = await wrappedToken.ownerOf(tokenId)
      expect(wrappedTokenOwner).to.be.equal(currentOwner.address)
    })

    it('should transfer to receive ERC721 wrapped without create if already exists', async function () {
      const [, currentOwner] = await getSigners()

      const { mockERC721, mockERC721Address } = await loadFixture(
        deployMockERC721Fixture
      )
      const { bridge, bridgeAddress } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress)
      )

      const evmChainId = 1
      const nonEvmChainId = 123456789
      const isEnabled = true

      const { mockAdapterAddress, mockAdapter } = await loadFixture(
        deployMockAdapterFixture
      )

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress,
        RampType.OffRamp,
        isEnabled,
        0n
      )

      const tokenId = 1
      const tokenId2 = 2

      await mockERC721.mint(tokenId)
      await mockERC721.mint(tokenId2)

      /// grant role to bridge contract
      await accessManagement.grantRole(ADAPTER_ROLE, mockAdapterAddress, 0)

      /// grant function role  to bridge contract
      await accessManagement.setTargetFunctionRole(
        bridgeAddress,
        [bridge.interface.getFunction('receiveERC721').selector],
        ADAPTER_ROLE
      )

      const encodedData = abiCoder.encode(
        ['address', 'bytes', 'bytes'],
        [
          currentOwner.address,
          abiCoder.encode(
            ['uint256', 'address', 'uint256'],
            [evmChainId, mockERC721Address, tokenId]
          ),
          abiCoder.encode(
            ['string', 'string', 'string'],
            [
              await mockERC721.name(),
              await mockERC721.symbol(),
              await mockERC721.tokenURI(tokenId)
            ]
          )
        ]
      )

      const encodedData2 = abiCoder.encode(
        ['address', 'bytes', 'bytes'],
        [
          currentOwner.address,
          abiCoder.encode(
            ['uint256', 'address', 'uint256'],
            [evmChainId, mockERC721Address, tokenId2]
          ),
          abiCoder.encode(
            ['string', 'string', 'string'],
            [
              await mockERC721.name(),
              await mockERC721.symbol(),
              await mockERC721.tokenURI(tokenId2)
            ]
          )
        ]
      )

      const payload = {
        fromChain: nonEvmChainId,
        sender: mockAdapterAddress,
        data: encodedData
      }

      const payload2 = {
        fromChain: nonEvmChainId,
        sender: mockAdapterAddress,
        data: encodedData2
      }

      const tx = await mockAdapter.receiveMessage(payload, bridgeAddress)
      const receipt = await tx.wait()
      const filter = bridge.filters.ERC721WrappedCreated
      const logs = await bridge.queryFilter(filter, receipt?.blockHash)
      const [, , wrappedTokenAddress] = logs[0].args

      const wrappedToken = await ethers.getContractAt(
        'ERC721',
        wrappedTokenAddress
      )

      await mockAdapter.receiveMessage(payload2, bridgeAddress)

      const wrappedTokenOwner = await wrappedToken.ownerOf(tokenId2)
      expect(wrappedTokenOwner).to.be.equal(currentOwner.address)
    })

    it('should transfer to receive ERC721 original when it is origin evm chain id', async function () {
      const [, currentOwner] = await getSigners()
      const evmChainId = 137

      const { mockERC721, mockERC721Address } = await loadFixture(
        deployMockERC721Fixture
      )

      const { bridge, bridgeAddress } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
      )

      const nonEvmChainId = 12334124515
      const isEnabled = true

      const { mockAdapterAddress, mockAdapter } = await loadFixture(
        deployMockAdapterFixture
      )

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress,
        RampType.OnRamp,
        isEnabled,
        0n
      )

      const tokenId = 1
      await mockERC721.mint(tokenId)

      /// grant role to bridge contract
      await accessManagement.grantRole(ADAPTER_ROLE, mockAdapterAddress, 0)

      /// grant function role  to bridge contract
      await accessManagement.setTargetFunctionRole(
        bridgeAddress,
        [bridge.interface.getFunction('receiveERC721').selector],
        ADAPTER_ROLE
      )

      await mockERC721.approve(bridgeAddress, tokenId)
      await bridge.sendERC721UsingNative(evmChainId, mockERC721Address, tokenId)

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress,
        RampType.OffRamp,
        isEnabled,
        0n
      )

      const encodedData = abiCoder.encode(
        ['address', 'bytes', 'bytes'],
        [
          currentOwner.address,
          abiCoder.encode(
            ['uint256', 'address', 'uint256'],
            [evmChainId, mockERC721Address, tokenId]
          ),
          abiCoder.encode(
            ['string', 'string', 'string'],
            [
              await mockERC721.name(),
              await mockERC721.symbol(),
              await mockERC721.tokenURI(tokenId)
            ]
          )
        ]
      )

      const payload = {
        fromChain: nonEvmChainId,
        sender: mockAdapterAddress,
        data: encodedData
      }

      await mockAdapter.receiveMessage(payload, bridgeAddress)

      const ERC721Owner = await mockERC721.ownerOf(tokenId)
      expect(ERC721Owner).to.be.equal(currentOwner.address)
    })

    describe('Checks', () => {
      it('should revert receive if sender not allowed', async function () {
        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 137
        const nonEvmChainId = 12334124515
        const isEnabled = true

        const { mockAdapterAddress, mockAdapter } = await loadFixture(
          deployMockAdapterFixture
        )

        await bridge.setChainSetting(
          evmChainId,
          nonEvmChainId,
          mockAdapterAddress,
          RampType.OnRamp,
          isEnabled,
          0n
        )

        /// it will fail, since onramp not allow offramp directly
        const payload = {
          fromChain: nonEvmChainId,
          sender: mockAdapterAddress,
          data: '0x'
        }

        await expect(
          mockAdapter.receiveMessage(payload, bridgeAddress)
        ).to.be.revertedWithCustomError(bridge, 'AccessManagedUnauthorized')
      })

      it('should revert if adapter is not set', async function () {
        const [, currentOwner] = await getSigners()

        const { mockERC721, mockERC721Address } = await loadFixture(
          deployMockERC721Fixture
        )
        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 1
        const nonEvmChainId = 123456789

        const { mockAdapterAddress, mockAdapter } = await loadFixture(
          deployMockAdapterFixture
        )

        const tokenId = 1
        await mockERC721.mint(tokenId)

        /// grant role to bridge contract
        await accessManagement.grantRole(
          ADAPTER_ROLE,
          mockAdapterAddress,
          ADAPTER_ROLE_DELAY
        )

        /// grant function role  to bridge contract
        await accessManagement.setTargetFunctionRole(
          bridgeAddress,
          [bridge.interface.getFunction('receiveERC721').selector],
          ADAPTER_ROLE
        )

        const encodedData = abiCoder.encode(
          ['address', 'bytes', 'bytes'],
          [
            currentOwner.address,
            abiCoder.encode(
              ['uint256', 'address', 'uint256'],
              [evmChainId, mockERC721Address, tokenId]
            ),
            abiCoder.encode(
              ['string', 'string', 'string'],
              [
                await mockERC721.name(),
                await mockERC721.symbol(),
                await mockERC721.tokenURI(tokenId)
              ]
            )
          ]
        )

        const payload = {
          fromChain: nonEvmChainId,
          sender: mockAdapterAddress,
          data: encodedData
        }

        await expect(
          mockAdapter.receiveMessage(payload, bridgeAddress)
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotFound')
      })

      it('should revert if adapter is not allowed', async function () {
        const [, currentOwner] = await getSigners()

        const { mockERC721, mockERC721Address } = await loadFixture(
          deployMockERC721Fixture
        )
        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 1
        const nonEvmChainId = 123456789
        const isEnabled = false

        const { mockAdapterAddress, mockAdapter } = await loadFixture(
          deployMockAdapterFixture
        )

        await bridge.setChainSetting(
          evmChainId,
          nonEvmChainId,
          mockAdapterAddress,
          RampType.OffRamp,
          isEnabled,
          0n
        )

        const tokenId = 1
        await mockERC721.mint(tokenId)

        /// grant role to bridge contract
        await accessManagement.grantRole(
          ADAPTER_ROLE,
          mockAdapterAddress,
          ADAPTER_ROLE_DELAY
        )

        /// grant function role  to bridge contract
        await accessManagement.setTargetFunctionRole(
          bridgeAddress,
          [bridge.interface.getFunction('receiveERC721').selector],
          ADAPTER_ROLE
        )

        const encodedData = abiCoder.encode(
          ['address', 'bytes', 'bytes'],
          [
            currentOwner.address,
            abiCoder.encode(
              ['uint256', 'address', 'uint256'],
              [evmChainId, mockERC721Address, tokenId]
            ),
            abiCoder.encode(
              ['string', 'string', 'string'],
              [
                await mockERC721.name(),
                await mockERC721.symbol(),
                await mockERC721.tokenURI(tokenId)
              ]
            )
          ]
        )

        const payload = {
          fromChain: nonEvmChainId,
          sender: mockAdapterAddress,
          data: encodedData
        }

        await expect(
          mockAdapter.receiveMessage(payload, bridgeAddress)
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotEnabled')
      })
    })
  })

  describe('Checks', () => {
    it('should revert if call safe transfer from another contract', async function () {
      const { mockERC721, mockERC721Address } = await loadFixture(
        deployMockERC721Fixture
      )

      const { bridge, bridgeAddress } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress)
      )

      const tokenId = 1
      await mockERC721.mint(tokenId)

      const { mockContractGeneral, mockContractGeneralAddress } =
        await loadFixture(deployMockContractGeneralFixture)

      mockERC721.approve(mockContractGeneralAddress, tokenId)

      await expect(
        mockContractGeneral.transferERC721ViaContract(
          mockERC721Address,
          tokenId,
          bridgeAddress
        )
      ).to.be.revertedWithCustomError(bridge, 'TransferNotAllowed')
    })
  })
})
