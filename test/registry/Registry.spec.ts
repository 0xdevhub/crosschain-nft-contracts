import {
  time,
  loadFixture
} from '@nomicfoundation/hardhat-toolbox/network-helpers'

import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployRegistryFixture, VAULT_V1 } from './fixture'

describe('Registry', function () {
  it('should set adapter data on create', async function () {
    const { registry } = await loadFixture(deployRegistryFixture)

    const adapterType = VAULT_V1
    const adapterAddress = ethers.ZeroAddress

    const tx = await registry.createAdapter(adapterType, adapterAddress)
    const receipt = await tx.wait()

    const filter = registry.filters.Registry_AdapterCreated
    const logs = await registry.queryFilter(filter, receipt?.blockHash)
    const [adapterId] = logs[0].args

    const adapter = await registry.getAdapter(adapterId)

    expect({
      adapterType: adapter.adapterType,
      adapterAddress: adapter.adapterAddress,
      enabled: adapter.enabled
    }).to.deep.equal({
      adapterType,
      adapterAddress,
      enabled: false
    })
  })

  it('should revert if not manager', async function () {
    const [, notManager] = await ethers.getSigners()
    const { registry } = await loadFixture(deployRegistryFixture)

    const adapterType = VAULT_V1
    const adapterAddress = ethers.ZeroAddress

    await expect(
      registry.connect(notManager).createAdapter(adapterType, adapterAddress)
    ).to.be.revertedWithCustomError(registry, 'Roles_NotRoleManager')
  })
})
