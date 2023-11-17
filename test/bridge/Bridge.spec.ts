import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployBridgeFixture } from './fixture'

describe('Bridge', function () {
  it('should return adapter address', async function () {
    const accessManagementAddress = ethers.ZeroAddress
    const adapterAddress = '0x00000000000000000000000000000000000000f8'

    const { bridge } = await loadFixture(
      deployBridgeFixture.bind(this, accessManagementAddress, adapterAddress)
    )

    const adapter = await bridge.adapter()

    expect(adapter).to.be.equal(adapterAddress)
  })
})
