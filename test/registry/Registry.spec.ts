import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'

import { expect } from 'chai'
import { ethers } from 'hardhat'

import {
  deployAccessManagementFixture,
  DEVELOPER_ROLE
} from '@/test/access-management/fixtures'

import { deployRegistryFixture, VAULT_V1 } from './fixture'

describe('Registry', function () {
  it('should set adapter data on create', async function () {
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

    // create adapter
    const adapterType = VAULT_V1
    const adapterAddress = ethers.ZeroAddress
    const tx = await registry
      .connect(developer)
      .createAdapter(adapterType, adapterAddress)
    const receipt = await tx.wait()
    const filter = registry.filters.Registry_AdapterCreated
    const logs = await registry.queryFilter(filter, receipt?.blockHash)
    const [adapterId] = logs[0].args
    const adapter = await registry.getAdapter(adapterId)

    expect({
      adapterType: adapter.adapterType,
      adapterAddress: adapter.adapterAddress
    }).to.deep.equal({
      adapterType,
      adapterAddress
    })
  })

  it('should not repeat adapter id', async function () {
    const { accessManagementAddress, accessManagement } = await loadFixture(
      deployAccessManagementFixture
    )

    const { registry, registryAddress, developer } = await loadFixture(
      deployRegistryFixture.bind(this, accessManagementAddress)
    )

    await accessManagement.grantRole(DEVELOPER_ROLE, developer.address, 0n)
    await accessManagement.setTargetFunctionRole(
      registryAddress,
      [registry.interface.getFunction('createAdapter').selector],
      DEVELOPER_ROLE
    )

    const adapterType = VAULT_V1
    const adapterAddress = ethers.ZeroAddress

    const tx = await registry
      .connect(developer)
      .createAdapter(adapterType, adapterAddress)

    const receipt = await tx.wait()
    const filter = registry.filters.Registry_AdapterCreated
    const logs = await registry.queryFilter(filter, receipt?.blockHash)
    const [adapterId1] = logs[0].args

    const tx2 = await registry
      .connect(developer)
      .createAdapter(adapterType, adapterAddress)

    const receipt2 = await tx2.wait()
    const logs2 = await registry.queryFilter(filter, receipt2?.blockHash)
    const [adapterId2] = logs2[0].args

    expect(adapterId1).to.not.equal(adapterId2)
  })
})
