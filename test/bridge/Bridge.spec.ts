import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { AccessManagement } from '@/typechain/contracts/AccessManagement'

import { deployAccessManagementFixture } from '@/test/accessManagement/fixtures'

import {
  deployBridgeFixture,
  deployMockAdapterFixture,
  deployMockNFTFixture
} from './fixture'
import { getSigners } from '@/scripts/utils'
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
    const abstractedChainId = 80_001

    await expect(
      bridge
        .connect(unknown)
        .setAdapter(nativeChainId, abstractedChainId, adapterAddress)
    ).to.be.revertedWithCustomError(bridge, 'AccessManagedUnauthorized')
  })

  it('should set adapter by native chain id', async function () {
    const adapterAddress = '0x00000000000000000000000000000000000000D2'

    const { bridge } = await loadFixture(
      deployBridgeFixture.bind(this, accessManagementAddress)
    )

    const nativeChainId = 137
    const abstractedChainId = 80_001

    await bridge.setAdapter(nativeChainId, abstractedChainId, adapterAddress)

    const adapter = await bridge.adapters(nativeChainId)

    expect([adapter.abstractedChainId, adapter.adapter]).to.deep.equal([
      abstractedChainId,
      adapterAddress
    ])
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
      bridge.transferToChain(
        nativeChainId,
        receiver.address,
        fakeNFTAddress,
        fakeNFTTokenId
      )
    ).to.be.revertedWithCustomError(bridge, 'AdapterNotFound')
  })

  it('should revert if the amount sent as fee token is insufficient', async function () {
    const fakeNFTAddress = ethers.ZeroAddress
    const fakeNFTTokenId = 0

    const [receiver] = await getSigners()

    const { bridge } = await loadFixture(
      deployBridgeFixture.bind(this, accessManagementAddress)
    )

    const nativeChainId = 137
    const abstractedChainId = 12334124515

    const { mockAdapterAddress, mockAdapter } = await loadFixture(
      deployMockAdapterFixture
    )

    await mockAdapter.setFee(200_000)

    await bridge.setAdapter(
      nativeChainId,
      abstractedChainId,
      mockAdapterAddress
    )

    await expect(
      bridge.transferToChain(
        nativeChainId,
        receiver.address,
        fakeNFTAddress,
        fakeNFTTokenId
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
    const abstractedChainId = 12334124515

    const { mockAdapterAddress } = await loadFixture(deployMockAdapterFixture)

    await bridge.setAdapter(
      nativeChainId,
      abstractedChainId,
      mockAdapterAddress
    )

    const tokenId = 1
    await mockNFT.mint(tokenId)
    await mockNFT.setApprovalForAll(bridgeAddress, true)

    await bridge.transferToChain(
      nativeChainId,
      receiver.address,
      mockNFTAddress,
      tokenId
    )

    const nftOwner = await mockNFT.ownerOf(tokenId)
    expect(nftOwner).to.be.equal(bridgeAddress)
  })
})
