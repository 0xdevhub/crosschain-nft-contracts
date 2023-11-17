import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { AccessManagement } from '@/typechain/contracts/AccessManagement'

import { deployAccessManagementFixture } from '@/test/accessManagement/fixtures'

import { deployBridgeFixture } from './fixture'

describe('Bridge', function () {
  it('should return adapter address', async function () {
    let accessManagement: AccessManagement
    let accessManagementAddress: string

    beforeEach(async function () {
      // initialize access management fixture
      const fixture = await loadFixture(deployAccessManagementFixture)
      accessManagement = fixture.accessManagement
      accessManagementAddress = fixture.accessManagementAddress
    })
  })
})
