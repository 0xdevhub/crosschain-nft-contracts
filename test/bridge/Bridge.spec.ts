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
import { ADAPTER_ROLE } from '@/scripts/constants'
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
      const deployedChainId = 1372

      const { bridge } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress, deployedChainId)
      )

      const chainId = await bridge.chainId()

      expect(chainId).to.be.equal(deployedChainId)
    })

    it('should set chain settings by evm chain id', async function () {
      const adapterAddress = '0x00000000000000000000000000000000000000D2'

      const { bridge } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress)
      )

      const evmChainId = 137
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

      expect({
        adapter: adapterAddress,
        nonEvmChainId,
        isEnabled
      }).to.deep.equal({
        adapter: adapter.adapter,
        nonEvmChainId: adapter.nonEvmChainId,
        isEnabled: adapter.isEnabled
      })
    })

    it('should emit event when chain settings is set', async function () {
      const adapterAddress = '0x00000000000000000000000000000000000000D2'

      const { bridge } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress)
      )

      const evmChainId = 137
      const nonEvmChainId = 125125352345
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
      )
        .to.emit(bridge, 'EvmChainSettingsSet')
        .withArgs(evmChainId, RampType.OnRamp)
    })

    describe('Checks', () => {
      it('should revert call to set chain settings address when unkown caller', async function () {
        const [, unknown] = await getSigners()
        const adapterAddress = '0x00000000000000000000000000000000000000D2'

        const { bridge } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 137
        const nonEvmChainId = 125125352345
        const isEnabled = true

        await expect(
          bridge
            .connect(unknown)
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
    })
  })

  describe('Commit OnRamp', () => {
    it('should transfer ERC721 to bridge contract using native as fee token', async function () {
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

    it('should transfer ERC721 to bridge contract using ERC20 token as fee', async function () {
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

    it('should burn ERC721 when transfer to bridge contract if its origin chain using native', async function () {
      const [currentOwner] = await getSigners()

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
        RampType.OnRamp,
        isEnabled,
        0n
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

      /// grant role to bridge contract
      await accessManagement.grantRole(ADAPTER_ROLE, mockAdapterAddress, 0)

      /// grant function role  to bridge contract
      await accessManagement.setTargetFunctionRole(
        bridgeAddress,
        [bridge.interface.getFunction('receiveERC721').selector],
        ADAPTER_ROLE
      )

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

    it('should burn ERC721 when transfer to bridge contract if its origin chain using erc20', async function () {
      const [currentOwner] = await getSigners()

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
      const nonEvmChainId = 123456789
      const isEnabled = true

      const { mockAdapterAddress, mockAdapter } = await loadFixture(
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

      /// grant role to bridge contract
      await accessManagement.grantRole(ADAPTER_ROLE, mockAdapterAddress, 0)

      /// grant function role  to bridge contract
      await accessManagement.setTargetFunctionRole(
        bridgeAddress,
        [bridge.interface.getFunction('receiveERC721').selector],
        ADAPTER_ROLE
      )

      const tx = await mockAdapter.receiveMessage(payload, bridgeAddress)
      const receipt = await tx.wait()
      const filter = bridge.filters.ERC721WrappedCreated
      const logs = await bridge.queryFilter(filter, receipt?.blockHash)

      const [, , wrappedTokenAddress] = logs[0].args

      const wrappedToken = await ethers.getContractAt(
        'WERC721',
        wrappedTokenAddress
      )

      const expectedAmount = 100_000n
      await mockAdapter.setFee(expectedAmount)

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

    it('should emit event on transfer ERC721 to bridge contract', async function () {
      const [currentOwner] = await getSigners()
      const { mockERC721, mockERC721Address } = await loadFixture(
        deployMockERC721Fixture
      )

      const { bridge, bridgeAddress } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress)
      )

      const evmChainId = 137
      const nonEvmChainId = 12334124515
      const isEnabled = true

      const { mockAdapterAddress } = await loadFixture(deployMockAdapterFixture)

      await bridge.setChainSetting(
        evmChainId,
        nonEvmChainId,
        mockAdapterAddress,
        RampType.OnRamp,
        isEnabled,
        0n
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
      await mockERC721.approve(bridgeAddress, tokenId)

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

      await expect(
        bridge.sendERC721UsingNative(evmChainId, mockERC721Address, tokenId)
      )
        .to.emit(bridge, 'ERC721Sent')
        .withArgs(evmChainId, mockAdapterAddress, encodedData)
    })

    describe('Checks', () => {
      it('should revert if the amount sent as fee token is insufficient using native', async function () {
        const evmChainId = 137

        const { mockERC721Address, mockERC721 } = await loadFixture(
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

        await mockAdapter.setFee(200_000)
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
          bridge.sendERC721UsingNative(evmChainId, mockERC721Address, tokenId)
        ).to.be.revertedWithCustomError(bridge, 'InsufficientFeeTokenAmount')
      })

      it('should revert if the amount sent as fee token is insufficient using ERC20', async function () {
        const evmChainId = 137

        const { mockERC721Address, mockERC721 } = await loadFixture(
          deployMockERC721Fixture
        )

        const { mockERC20Address, mockERC20 } = await loadFixture(
          deployMockERC20Fixture
        )

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress, evmChainId)
        )

        const nonEvmChainId = 12334124515
        const isEnabled = true

        const { mockAdapterAddress, mockAdapter } = await loadFixture(
          deployMockAdapterFixture
        )

        await mockAdapter.setFee(200_000n)
        await mockAdapter.setFeeToken(mockERC20Address)
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
        await mockERC20.approve(bridgeAddress, 100_000n)

        await expect(
          bridge.sendERC721UsingERC20(
            evmChainId,
            mockERC721Address,
            tokenId,
            100_000n
          )
        ).to.be.revertedWithCustomError(bridge, 'InsufficientFeeTokenAmount')
      })

      it('should revert if call send erc721 using native if adapter is erc20', async function () {
        const evmChainId = 137

        const { mockERC721Address, mockERC721 } = await loadFixture(
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

        await mockAdapter.setFeeToken(mockERC721Address)

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
          bridge.sendERC721UsingNative(evmChainId, mockERC721Address, tokenId)
        ).to.be.revertedWithCustomError(bridge, 'OperationNotSupported')
      })

      it('should revert if call send erc721 using erc20 if adapter is native', async function () {
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

      it('should revert if adapter is not valid using native', async function () {
        const fakeERC721Address = ethers.ZeroAddress
        const fakeERC721TokenId = 0
        const [receiver] = await getSigners()
        const { bridge } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 137

        await expect(
          bridge.sendERC721UsingNative(
            evmChainId,
            fakeERC721Address,
            fakeERC721TokenId
          )
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotFound')
      })

      it('should revert if adapter is not valid using erc29', async function () {
        const fakeERC721Address = ethers.ZeroAddress
        const fakeERC721TokenId = 0
        const { bridge } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 137

        await expect(
          bridge.sendERC721UsingERC20(
            evmChainId,
            fakeERC721Address,
            fakeERC721TokenId,
            0n
          )
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotFound')
      })

      it('should revert if adapter is not enabled using native', async function () {
        const { mockERC721, mockERC721Address } = await loadFixture(
          deployMockERC721Fixture
        )

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 137
        const nonEvmChainId = 12334124515
        const isEnabled = false

        const { mockAdapterAddress } = await loadFixture(
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
        await mockERC721.approve(bridgeAddress, tokenId)

        await expect(
          bridge.sendERC721UsingNative(evmChainId, mockERC721Address, tokenId)
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotEnabled')
      })

      it('should revert if adapter is not enabled using erc20', async function () {
        const { mockERC721, mockERC721Address } = await loadFixture(
          deployMockERC721Fixture
        )

        const { mockERC20 } = await loadFixture(deployMockERC20Fixture)

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 137
        const nonEvmChainId = 12334124515
        const isEnabled = false

        const { mockAdapterAddress } = await loadFixture(
          deployMockAdapterFixture
        )

        const expectedAmount = 100_000n

        await mockERC20.approve(bridgeAddress, expectedAmount)

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

  describe('Commit OffRamp', () => {
    it('should create and transfer ERC721 wrapped to receiver', async function () {
      const [currentOwner] = await getSigners()

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

      /// grant role to bridge contract
      await accessManagement.grantRole(ADAPTER_ROLE, mockAdapterAddress, 0)

      /// grant function role  to bridge contract
      await accessManagement.setTargetFunctionRole(
        bridgeAddress,
        [bridge.interface.getFunction('receiveERC721').selector],
        ADAPTER_ROLE
      )

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

    it('should transfer ERC721 wrapped to receiver without create erc721 wrapped when its already created', async function () {
      const [currentOwner] = await getSigners()

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

      /// grant role to bridge contract
      await accessManagement.grantRole(ADAPTER_ROLE, mockAdapterAddress, 0)

      /// grant function role  to bridge contract
      await accessManagement.setTargetFunctionRole(
        bridgeAddress,
        [bridge.interface.getFunction('receiveERC721').selector],
        ADAPTER_ROLE
      )

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

    it('should transfer ERC721 to receiver without create erc721 wrapped when its origin chain', async function () {
      const [currentOwner] = await getSigners()
      /// send erc721 to bridge contract
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
      await mockERC721.approve(bridgeAddress, tokenId)
      await bridge.sendERC721UsingNative(evmChainId, mockERC721Address, tokenId)

      /// Receive erc721 from bridge contract

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

      /// grant role to bridge contract
      await accessManagement.grantRole(ADAPTER_ROLE, mockAdapterAddress, 0)

      /// grant function role  to bridge contract
      await accessManagement.setTargetFunctionRole(
        bridgeAddress,
        [bridge.interface.getFunction('receiveERC721').selector],
        ADAPTER_ROLE
      )

      await mockAdapter.receiveMessage(payload, bridgeAddress)

      const ERC721Owner = await mockERC721.ownerOf(tokenId)
      expect(ERC721Owner).to.be.equal(currentOwner.address)
    })

    describe('Checks', () => {
      it('should revert call commit offramp when unkown caller', async function () {
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

      it('should revert if adapter is not valid', async function () {
        const [invalidSender] = await getSigners()

        const { bridge } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const nonevmChainId = 137125125

        const payload = {
          fromChain: nonevmChainId,
          sender: invalidSender.address,
          data: '0x'
        }

        await expect(
          bridge.receiveERC721(payload)
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotFound')
      })

      it('should revert if adapter is not enabled', async function () {
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

        const payload = {
          fromChain: nonEvmChainId,
          sender: ethers.ZeroAddress,
          data: '0x'
        }

        /// grant role to bridge contract to call receiveERC721
        await accessManagement.grantRole(ADAPTER_ROLE, mockAdapterAddress, 0)

        /// grant access to bridge contract to call receiveERC721
        await accessManagement.setTargetFunctionRole(
          bridgeAddress,
          [bridge.interface.getFunction('receiveERC721').selector],
          ADAPTER_ROLE
        )

        await expect(
          mockAdapter.receiveMessage(payload, bridgeAddress)
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotEnabled')
      })
    })
  })
})
