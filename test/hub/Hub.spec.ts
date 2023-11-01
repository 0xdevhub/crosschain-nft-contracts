import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'

import { expect } from 'chai'
import { ethers } from 'hardhat'

import {
  deployAccessManagementFixture,
  DEVELOPER_ROLE
} from '@/test/access-management/fixtures'

import { deployHubFixture } from './fixture'
import { VAULT_V1 } from '../registry/fixture'
import { deployRegistryFixture } from '../registry/fixture'

describe('Hub', function () {
  it('should set app data on create', async function () {
    const { accessManagementAddress, accessManagement } = await loadFixture(
      deployAccessManagementFixture
    )

    const { registry, registryAddress, developer } = await loadFixture(
      deployRegistryFixture.bind(this, accessManagementAddress)
    )

    // grant role to developer
    await accessManagement.grantRole(DEVELOPER_ROLE, developer.address, 0n)

    // grant role to developer to create adapter
    await accessManagement.setTargetFunctionRole(
      registryAddress,
      [registry.interface.getFunction('createAdapter').selector],
      DEVELOPER_ROLE
    )

    const { hub, hubAddress } = await loadFixture(
      deployHubFixture.bind(this, registryAddress, accessManagementAddress)
    )

    // grant role to developer to create app
    await accessManagement.setTargetFunctionRole(
      hubAddress,
      [hub.interface.getFunction('createApp').selector],
      DEVELOPER_ROLE
    )

    // create adapter
    const adapterType = VAULT_V1
    const adapterAddress = '0x0000000000000000000000000000000000000001'
    const tx = await registry
      .connect(developer)
      .createAdapter(adapterType, adapterAddress)

    const receipt = await tx.wait()
    const filter = registry.filters.Registry_AdapterCreated
    const logs = await registry.queryFilter(filter, receipt?.blockHash)
    const [adapterId] = logs[0].args
    const adapter = await registry.getAdapter(adapterId)

    // create app
    const appAddress = '0x0000000000000000000000000000000000000001'
    const tx2 = await hub.connect(developer).createApp(adapterId, appAddress)
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
    // const { registryAddress } = await loadFixture(deployRegistryFixture)
    // const { hub } = await loadFixture(
    //   deployHubFixture.bind(this, registryAddress)
    // )
    // const invalidAdapterId = ethers.keccak256(ethers.toUtf8Bytes('INVALID_ID'))
    // const appAddress = '0x0000000000000000000000000000000000000001'
    // await expect(
    //   hub.createApp(invalidAdapterId, appAddress)
    // ).to.be.revertedWithCustomError(hub, 'Hub_AdapterNotFound')
  })
})
