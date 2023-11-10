import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'

import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployAccessManagementFixture } from '@/test/accessManagement/fixtures'
import { deployHubFixture } from './fixture'

describe('Hub', function () {
  it('should add app by app address', async function () {
    const [, developer] = await ethers.getSigners()

    const { accessManagementAddress, accessManagement } = await loadFixture(
      deployAccessManagementFixture
    )

    const DEVELOPER_ROLE = 1n
    const DELAY = 0n

    // grant developer role to address
    await accessManagement.grantRole(DEVELOPER_ROLE, developer.address, DELAY)

    const { hub, hubAddress } = await loadFixture(
      deployHubFixture.bind(this, accessManagementAddress)
    )

    // grant role to developer to add app
    await accessManagement.setTargetFunctionRole(
      hubAddress,
      [hub.interface.getFunction('addApp').selector],
      DEVELOPER_ROLE
    )

    // create app
    const appAddress = '0x0000000000000000000000000000000000000001'
    const tx2 = await hub.connect(developer).addApp(appAddress)
    const receipt2 = await tx2.wait()
    const filter2 = hub.filters.Hub_AppAdded
    const logs2 = await hub.queryFilter(filter2, receipt2?.blockHash)
    const [appId] = logs2[0].args

    const app = await hub.getApp(appId)

    expect({
      appAddress: app.appAddress
    }).to.deep.equal({
      appAddress
    })
  })

  it('should revert if try to call addApp without role', async function () {
    const [, developer] = await ethers.getSigners()

    const { accessManagementAddress } = await loadFixture(
      deployAccessManagementFixture
    )

    const { hub } = await loadFixture(
      deployHubFixture.bind(this, accessManagementAddress)
    )

    const appAddress = '0x0000000000000000000000000000000000000001'

    await expect(
      hub.connect(developer).addApp(appAddress)
    ).to.be.revertedWithCustomError(hub, 'AccessManagedUnauthorized')
  })
})
