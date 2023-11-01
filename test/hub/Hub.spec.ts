import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'

import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployHubFixture } from './fixture'
import { VAULT_V1 } from '../registry/fixture'
import { deployRegistryFixture } from '../registry/fixture'

describe('Hub', function () {
  it('should set app data on create', async function () {
    const { registryAddress, registry } = await loadFixture(
      deployRegistryFixture
    )

    const { hub } = await loadFixture(
      deployHubFixture.bind(this, registryAddress)
    )

    // create adapter
    const adapterType = VAULT_V1
    const adapterAddress = '0x0000000000000000000000000000000000000001'
    const tx = await registry.createAdapter(adapterType, adapterAddress)
    const receipt = await tx.wait()
    const filter = registry.filters.Registry_AdapterCreated
    const logs = await registry.queryFilter(filter, receipt?.blockHash)
    const [adapterId] = logs[0].args
    const adapter = await registry.getAdapter(adapterId)

    // create app using adapter
    const appAddress = '0x0000000000000000000000000000000000000001'
    const tx2 = await hub.createApp(adapterId, appAddress)
    const receipt2 = await tx2.wait()
    const filter2 = hub.filters.Hub_AppCreated
    const logs2 = await hub.queryFilter(filter2, receipt2?.blockHash)
    const [appId] = logs2[0].args
    const app = await hub.getApp(appId)

    expect({
      appAddress: app.appAddress,
      adapter: app.adapter
    }).to.deep.equal({
      appAddress,
      adapter
    })
  })

  it('should revert if adapter does not exist', async function () {
    const { registryAddress } = await loadFixture(deployRegistryFixture)

    const { hub } = await loadFixture(
      deployHubFixture.bind(this, registryAddress)
    )

    const invalidAdapterId = ethers.keccak256(ethers.toUtf8Bytes('INVALID_ID'))
    const appAddress = '0x0000000000000000000000000000000000000001'

    await expect(
      hub.createApp(invalidAdapterId, appAddress)
    ).to.be.revertedWithCustomError(hub, 'Hub_AdapterNotFound')
  })
})
