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
    const adapterAddress = '0x0000000000000000000000000000000000000001'

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

  it('should revert if adapter already exists', async function () {
    const { registry } = await loadFixture(deployRegistryFixture)

    const adapterType = VAULT_V1
    const adapterAddress = '0x0000000000000000000000000000000000000001'

    await registry.createAdapter(adapterType, adapterAddress)

    await expect(
      registry.createAdapter(adapterType, adapterAddress)
    ).to.be.revertedWithCustomError(registry, 'Registry_AdapterAlreadyExists')
  })

  it('should revert if address zero', async function () {
    const { registry } = await loadFixture(deployRegistryFixture)

    const adapterType = VAULT_V1
    const adapterAddress = ethers.ZeroAddress

    await expect(
      registry.createAdapter(adapterType, adapterAddress)
    ).to.be.revertedWithCustomError(registry, 'Registry_AdapterAddressZero')
  })
})
