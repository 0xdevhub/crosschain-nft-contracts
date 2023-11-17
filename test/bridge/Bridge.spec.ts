import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { AccessManagement } from '@/typechain/contracts/AccessManagement'

import { deployAccessManagementFixture } from '@/test/accessManagement/fixtures'

import { deployBridgeFixture } from './fixture'

describe('Bridge', function () {
  let accessManagement: AccessManagement
  let accessManagementAddress: string

  beforeEach(async function () {
    // initialize access management fixture
    const fixture = await loadFixture(deployAccessManagementFixture)
    accessManagement = fixture.accessManagement
    accessManagementAddress = fixture.accessManagementAddress
  })

  it('should return adapter as zero address if not set', async function () {
    const adapterAddress = ethers.ZeroAddress
    const fixture = await loadFixture(
      deployBridgeFixture.bind(this, accessManagementAddress)
    )

    const adapter = await fixture.bridge.adapter()
    expect(adapter).to.be.equal(adapterAddress)
  })

  it('should set adapter address', async function () {
    const adapterAddress = '0x00000000000000000000000000000000000000D2'

    const { bridge } = await loadFixture(
      deployBridgeFixture.bind(this, accessManagementAddress)
    )

    await bridge.setAdapter(adapterAddress)

    const adapter = await bridge.adapter()
    expect(adapter).to.be.equal(adapterAddress)
  })
})
