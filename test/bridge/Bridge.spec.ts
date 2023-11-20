import { IBridge } from './../../typechain/contracts/interfaces/IBridge'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { AccessManagement } from '@/typechain/contracts/AccessManagement'

import { deployAccessManagementFixture } from '@/test/accessManagement/fixtures'

import {
  RampType,
  deployBridgeFixture,
  deployMockAdapterFixture,
  deployMockContractGeneralFixture,
  deployMockNFTFixture
} from './fixture'
import { abiCoder, getSigners } from '@/scripts/utils'
import { ethers } from 'hardhat'

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
      const chainId = 80_001
      const isEnabled = true

      await bridge.setChainSetting(
        evmChainId,
        chainId,
        adapterAddress,
        RampType.OnRamp,
        isEnabled
      )

      const adapter = await bridge.getChainSettings(evmChainId)

      expect({
        adapter: adapterAddress,
        nonEvmChainId: chainId,
        rampType: RampType.OnRamp
      }).to.deep.equal({
        adapter: adapter.adapter,
        nonEvmChainId: adapter.nonEvmChainId,
        rampType: adapter.rampType
      })
    })

    it('should emit event when chain settings is set', async function () {
      const adapterAddress = '0x00000000000000000000000000000000000000D2'

      const { bridge } = await loadFixture(
        deployBridgeFixture.bind(this, accessManagementAddress)
      )

      const evmChainId = 137
      const chainId = 80_001
      const isEnabled = true

      await expect(
        bridge.setChainSetting(
          evmChainId,
          chainId,
          adapterAddress,
          RampType.OnRamp,
          isEnabled
        )
      )
        .to.emit(bridge, 'ChainSettingsSet')
        .withArgs(evmChainId, chainId, adapterAddress)
    })

    describe('Checks', () => {
      it('should revert call to set chain settings address when unkown caller', async function () {
        const [, unknown] = await getSigners()
        const adapterAddress = '0x00000000000000000000000000000000000000D2'

        const { bridge } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 137
        const chainId = 80_001
        const isEnabled = true

        await expect(
          bridge
            .connect(unknown)
            .setChainSetting(
              evmChainId,
              chainId,
              adapterAddress,
              RampType.OnRamp,
              isEnabled
            )
        ).to.be.revertedWithCustomError(bridge, 'AccessManagedUnauthorized')
      })
    })
  })

  describe('Commit OnRamp', () => {
    it('should transfer ERC721 to bridge contract', async function () {
      const [receiver] = await getSigners()

      const { mockNFT, mockNFTAddress } =
        await loadFixture(deployMockNFTFixture)

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
        isEnabled
      )

      const tokenId = 1
      await mockNFT.mint(tokenId)
      await mockNFT.approve(bridgeAddress, tokenId)

      await bridge.bridgeERC721(
        evmChainId,
        receiver.address,
        mockNFTAddress,
        tokenId
      )

      const nftOwner = await mockNFT.ownerOf(tokenId)
      expect(nftOwner).to.be.equal(bridgeAddress)
    })

    it('should emit event on transfer ERC721 to bridge contract', async function () {
      const [receiver] = await getSigners()

      const { mockNFT, mockNFTAddress } =
        await loadFixture(deployMockNFTFixture)

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
        isEnabled
      )

      const tokenId = 1
      await mockNFT.mint(tokenId)
      await mockNFT.approve(bridgeAddress, tokenId)

      const encodedData = abiCoder.encode(
        ['address', 'uint256', 'string', 'string', 'string'],
        [
          mockNFTAddress,
          tokenId,
          await mockNFT.name(),
          await mockNFT.symbol(),
          await mockNFT.tokenURI(tokenId)
        ]
      )

      await expect(
        bridge.bridgeERC721(
          evmChainId,
          receiver.address,
          mockNFTAddress,
          tokenId
        )
      )
        .to.emit(bridge, 'MessageSent')
        .withArgs(nonEvmChainId, receiver.address, encodedData)
    })

    describe('Checks', () => {
      it('should revert if the amount sent as fee token is insufficient', async function () {
        const { mockNFTAddress, mockNFT } =
          await loadFixture(deployMockNFTFixture)

        const [receiver] = await getSigners()

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 137
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
          isEnabled
        )

        const tokenId = 1
        await mockNFT.mint(tokenId)
        await mockNFT.approve(bridgeAddress, tokenId)

        await expect(
          bridge.bridgeERC721(
            evmChainId,
            receiver.address,
            mockNFTAddress,
            tokenId
          )
        ).to.be.revertedWithCustomError(bridge, 'InsufficientFeeTokenAmount')
      })

      it('should revert if call safe transfer from another contract', async function () {
        const { mockNFT, mockNFTAddress } =
          await loadFixture(deployMockNFTFixture)

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const tokenId = 1
        await mockNFT.mint(tokenId)

        const { mockContractGeneral, mockContractGeneralAddress } =
          await loadFixture(deployMockContractGeneralFixture)

        mockNFT.approve(mockContractGeneralAddress, tokenId)

        await expect(
          mockContractGeneral.transferNFTViaContract(
            mockNFTAddress,
            tokenId,
            bridgeAddress
          )
        ).to.be.revertedWithCustomError(bridge, 'TransferNotAllowed')
      })

      it('should revert if adapter is not valid', async function () {
        const fakeNFTAddress = ethers.ZeroAddress
        const fakeNFTTokenId = 0
        const [receiver] = await getSigners()
        const { bridge } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 137

        await expect(
          bridge.bridgeERC721(
            evmChainId,
            receiver.address,
            fakeNFTAddress,
            fakeNFTTokenId
          )
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotFound')
      })

      it('should revert if adapter is not enabled', async function () {
        const { mockNFT, mockNFTAddress } =
          await loadFixture(deployMockNFTFixture)

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
          isEnabled
        )

        const tokenId = 1
        await mockNFT.mint(tokenId)
        await mockNFT.approve(bridgeAddress, tokenId)

        await expect(
          bridge.bridgeERC721(
            evmChainId,
            bridgeAddress,
            mockNFTAddress,
            tokenId
          )
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotEnabled')
      })

      it('should revert if adapter ramp type is not valid', async function () {
        const { mockNFT, mockNFTAddress } =
          await loadFixture(deployMockNFTFixture)

        const { bridge, bridgeAddress } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 137
        const nonEvmChainId = 12334124515
        const isEnabled = true

        const { mockAdapterAddress } = await loadFixture(
          deployMockAdapterFixture
        )

        await bridge.setChainSetting(
          evmChainId,
          nonEvmChainId,
          mockAdapterAddress,
          RampType.OffRamp,
          isEnabled
        )

        const tokenId = 1
        await mockNFT.mint(tokenId)
        await mockNFT.approve(bridgeAddress, tokenId)

        await expect(
          bridge.bridgeERC721(
            evmChainId,
            bridgeAddress,
            mockNFTAddress,
            tokenId
          )
        ).to.be.revertedWithCustomError(bridge, 'RampTypeNotAllowed')
      })
    })
  })

  describe('Commit OffRamp', () => {
    describe('Checks', () => {
      it('should revert if adapter is not valid', async function () {
        const [receiver] = await getSigners()
        const { bridge } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const nonevmChainId = 137125125

        const payload = {
          fromChain: nonevmChainId,
          sender: receiver.address,
          data: '0x'
        }

        await expect(
          bridge.commitOffRamp(payload)
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotFound')
      })

      it('should revert call commit offramp when unkown caller', async function () {
        const [, unknown] = await getSigners()

        const { bridge } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 137
        const nonEvmChainId = 12334124515
        const isEnabled = true

        const { mockAdapterAddress } = await loadFixture(
          deployMockAdapterFixture
        )

        await bridge.setChainSetting(
          evmChainId,
          nonEvmChainId,
          mockAdapterAddress,
          RampType.OffRamp,
          isEnabled
        )

        const payload = {
          fromChain: nonEvmChainId,
          sender: ethers.ZeroAddress,
          data: '0x'
        }
        await expect(
          bridge.connect(unknown).commitOffRamp(payload)
        ).to.be.revertedWithCustomError(bridge, 'AccessManagedUnauthorized')
      })

      it('should revert if adapter ramp type is not valid', async function () {
        const { bridge } = await loadFixture(
          deployBridgeFixture.bind(this, accessManagementAddress)
        )

        const evmChainId = 137
        const nonEvmChainId = 12334124515
        const isEnabled = true

        const { mockAdapterAddress } = await loadFixture(
          deployMockAdapterFixture
        )

        await bridge.setChainSetting(
          evmChainId,
          nonEvmChainId,
          mockAdapterAddress,
          RampType.OnRamp,
          isEnabled
        )

        const payload = {
          fromChain: nonEvmChainId,
          sender: ethers.ZeroAddress,
          data: '0x'
        }
        await expect(
          bridge.commitOffRamp(payload)
        ).to.be.revertedWithCustomError(bridge, 'RampTypeNotAllowed')
      })

      it('should revert if adapter is not enabled', async function () {
        const { bridge } = await loadFixture(
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
          RampType.OffRamp,
          isEnabled
        )

        const payload = {
          fromChain: nonEvmChainId,
          sender: ethers.ZeroAddress,
          data: '0x'
        }
        await expect(
          bridge.commitOffRamp(payload)
        ).to.be.revertedWithCustomError(bridge, 'AdapterNotEnabled')
      })
    })
  })
})
