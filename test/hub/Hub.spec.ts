import {
  time,
  loadFixture
} from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { AppType, deployHubFixture } from './fixture'

describe('Hub', function () {
  describe('Create', function () {
    it('Should set app data', async function () {
      const { owner, hub } = await loadFixture(deployHubFixture)

      const appAddress = ethers.ZeroAddress
      const appType = AppType.Vault

      const tx = await hub.createApp(appType, appAddress)
      const receipt = await tx.wait()

      const filter = hub.filters.Hub_AppCreated
      const logs = await hub.queryFilter(filter, receipt?.blockHash)
      const [appId] = logs[0].args

      const app = await hub.getApp(appId)
      const createdAt = await time.latest()

      expect({
        owner: app.owner,
        createdAt: app.createdAt,
        appType: app.appType,
        appAddress: app.appAddress
      }).to.deep.equal({
        owner: owner.address,
        appType,
        createdAt,
        appAddress
      })
    })

    it('should revert if use unknown app type', async function () {
      const { hub } = await loadFixture(deployHubFixture)

      const appAddress = ethers.ZeroAddress
      const appType = 1

      await expect(hub.createApp(appType, appAddress)).to.be.reverted
    })
  })
})
