import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployCCIPAdapterFixture } from './fixture'

describe('CCIPAdapter', function () {
  it('should return router address', async function () {
    const bridgeAddress = ethers.ZeroAddress
    const accessManagementAddress = ethers.ZeroAddress
    const routerAddress = '0x0000000000000000000000000000000000000001'

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        null,
        bridgeAddress,
        accessManagementAddress,
        routerAddress
      )
    )

    const router = await ccipAdapter.router()

    expect(router).to.be.equal(routerAddress)
  })
})
