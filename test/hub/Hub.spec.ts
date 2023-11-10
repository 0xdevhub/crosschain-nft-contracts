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

    await accessManagement.grantRole(DEVELOPER_ROLE, developer.address, DELAY)

    const { hub, hubAddress } = await loadFixture(
      deployHubFixture.bind(this, accessManagementAddress)
    )

    await accessManagement.setTargetFunctionRole(
      hubAddress,
      [hub.interface.getFunction('addApp').selector],
      DEVELOPER_ROLE
    )

    const appDetails = {
      address: '0x0000000000000000000000000000000000000001',
      name: 'App 1',
      description: 'App 1 description'
    }

    const tx = await hub
      .connect(developer)
      .addApp(appDetails.address, appDetails.name, appDetails.description)

    const receipt = await tx.wait()
    const filter = hub.filters.Hub_AppAdded
    const logs = await hub.queryFilter(filter, receipt?.blockHash)
    const [appId] = logs[0].args

    const app = await hub.getApp(appId)

    expect({
      appAddress: app.appAddress,
      name: app.name,
      description: app.description
    }).to.deep.equal({
      appAddress: appDetails.address,
      name: appDetails.name,
      description: appDetails.description
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

    const appDetails = {
      address: '0x0000000000000000000000000000000000000001',
      name: 'App 1',
      description: 'App 1 description'
    }
    await expect(
      hub
        .connect(developer)
        .addApp(appDetails.address, appDetails.name, appDetails.description)
    ).to.be.revertedWithCustomError(hub, 'AccessManagedUnauthorized')
  })
})
