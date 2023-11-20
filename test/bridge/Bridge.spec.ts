import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { AccessManagement } from '@/typechain/contracts/AccessManagement'

import { deployAccessManagementFixture } from '@/test/accessManagement/fixtures'

import {
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

  it('should revert call to set adapter address when unkown sender', async function () {
    const [, unknown] = await getSigners()
    const adapterAddress = '0x00000000000000000000000000000000000000D2'

    const { bridge } = await loadFixture(
      deployBridgeFixture.bind(this, accessManagementAddress)
    )

    const nativeChainId = 137
    const chainId = 80_001

    await expect(
      bridge.connect(unknown).setAdapter(nativeChainId, chainId, adapterAddress)
    ).to.be.revertedWithCustomError(bridge, 'AccessManagedUnauthorized')
  })

  it('should set adapter by native chain id', async function () {
    const adapterAddress = '0x00000000000000000000000000000000000000D2'

    const { bridge } = await loadFixture(
      deployBridgeFixture.bind(this, accessManagementAddress)
    )

    const nativeChainId = 137
    const chainId = 80_001

    await bridge.setAdapter(nativeChainId, chainId, adapterAddress)

    const adapter = await bridge.adapters(nativeChainId)

    expect([adapter.chainId, adapter.adapter]).to.deep.equal([
      chainId,
      adapterAddress
    ])
  })

  it('should emit event when adapter is set', async function () {
    const adapterAddress = '0x00000000000000000000000000000000000000D2'

    const { bridge } = await loadFixture(
      deployBridgeFixture.bind(this, accessManagementAddress)
    )

    const nativeChainId = 137
    const chainId = 80_001

    await expect(bridge.setAdapter(nativeChainId, chainId, adapterAddress))
      .to.emit(bridge, 'AdapterSet')
      .withArgs(nativeChainId, chainId, adapterAddress)
  })

  it('should revert if chain does not have any adapter', async function () {
    const fakeNFTAddress = ethers.ZeroAddress
    const fakeNFTTokenId = 0
    const [receiver] = await getSigners()
    const { bridge } = await loadFixture(
      deployBridgeFixture.bind(this, accessManagementAddress)
    )

    const nativeChainId = 137

    await expect(
      bridge.transferERC721(
        nativeChainId,
        receiver.address,
        fakeNFTAddress,
        fakeNFTTokenId
      )
    ).to.be.revertedWithCustomError(bridge, 'AdapterNotFound')
  })

  it('should revert if the amount sent as fee token is insufficient', async function () {
    const { mockNFTAddress, mockNFT } = await loadFixture(deployMockNFTFixture)

    const [receiver] = await getSigners()

    const { bridge, bridgeAddress } = await loadFixture(
      deployBridgeFixture.bind(this, accessManagementAddress)
    )

    const nativeChainId = 137
    const chainId = 12334124515

    const { mockAdapterAddress, mockAdapter } = await loadFixture(
      deployMockAdapterFixture
    )

    await mockAdapter.setFee(200_000)
    await bridge.setAdapter(nativeChainId, chainId, mockAdapterAddress)

    const tokenId = 1
    await mockNFT.mint(tokenId)
    await mockNFT.approve(bridgeAddress, tokenId)

    await expect(
      bridge.transferERC721(
        nativeChainId,
        receiver.address,
        mockNFTAddress,
        tokenId
      )
    ).to.be.revertedWithCustomError(bridge, 'InsufficientFeeTokenAmount')
  })

  it('should transfer NFT to bridge contract', async function () {
    const [receiver] = await getSigners()

    const { mockNFT, mockNFTAddress } = await loadFixture(deployMockNFTFixture)

    const { bridge, bridgeAddress } = await loadFixture(
      deployBridgeFixture.bind(this, accessManagementAddress)
    )

    const nativeChainId = 137
    const chainId = 12334124515

    const { mockAdapterAddress } = await loadFixture(deployMockAdapterFixture)

    await bridge.setAdapter(nativeChainId, chainId, mockAdapterAddress)

    const tokenId = 1
    await mockNFT.mint(tokenId)
    await mockNFT.approve(bridgeAddress, tokenId)

    await bridge.transferERC721(
      nativeChainId,
      receiver.address,
      mockNFTAddress,
      tokenId
    )

    const nftOwner = await mockNFT.ownerOf(tokenId)
    expect(nftOwner).to.be.equal(bridgeAddress)
  })

  it('should emit event when NFT is transferred to bridge contract', async function () {
    const [receiver] = await getSigners()

    const { mockNFT, mockNFTAddress } = await loadFixture(deployMockNFTFixture)

    const { bridge, bridgeAddress } = await loadFixture(
      deployBridgeFixture.bind(this, accessManagementAddress)
    )

    const nativeChainId = 137
    const chainId = 12334124515

    const { mockAdapterAddress } = await loadFixture(deployMockAdapterFixture)

    await bridge.setAdapter(nativeChainId, chainId, mockAdapterAddress)

    const tokenId = 1
    await mockNFT.mint(tokenId)
    await mockNFT.approve(bridgeAddress, tokenId)

    // , 'string', 'string', 'string'
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
      bridge.transferERC721(
        nativeChainId,
        receiver.address,
        mockNFTAddress,
        tokenId
      )
    )
      .to.emit(bridge, 'MessageSent')
      .withArgs(chainId, receiver.address, encodedData)
  })

  it('should revert if call safe transfer from another contract', async function () {
    const { mockNFT, mockNFTAddress } = await loadFixture(deployMockNFTFixture)

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
})
