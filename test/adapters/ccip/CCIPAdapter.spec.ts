import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import {
  deployCCIPAdapterFixture,
  deployCCIPRouterMockFixture
} from './fixture'
import { IBridge } from '@/typechain'

describe('CCIPAdapter', function () {
  it('should return router address', async function () {
    const bridgeAddress = ethers.ZeroAddress
    const accessManagementAddress = ethers.ZeroAddress
    const routerAddress = '0x00000000000000000000000000000000000000D2'

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

  it('should set bridge address', async function () {
    const bridgeAddress = '0x00000000000000000000000000000000000000B8'
    const accessManagementAddress = ethers.ZeroAddress
    const routerAddress = '0x00000000000000000000000000000000000000D2'

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        null,
        bridgeAddress,
        accessManagementAddress,
        routerAddress
      )
    )

    const bridge = await ccipAdapter.bridge()

    expect(bridge).to.be.equal(bridgeAddress)
  })

  it('should return fee token as zero address', async function () {
    const bridgeAddress = ethers.ZeroAddress
    const accessManagementAddress = ethers.ZeroAddress
    const routerAddress = '0x00000000000000000000000000000000000000D2'

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        null,
        bridgeAddress,
        accessManagementAddress,
        routerAddress
      )
    )

    const feeToken = await ccipAdapter.feeToken()

    expect(feeToken).to.be.equal(ethers.ZeroAddress)
  })

  it('should return the required amount fee for sending message', async function () {
    const bridgeAddress = ethers.ZeroAddress
    const accessManagementAddress = ethers.ZeroAddress
    const { mockCCIPRouterAddress, mockCCIPRouter } = await loadFixture(
      deployCCIPRouterMockFixture
    )

    const { ccipAdapter } = await loadFixture(
      deployCCIPAdapterFixture.bind(
        null,
        bridgeAddress,
        accessManagementAddress,
        mockCCIPRouterAddress
      )
    )

    const expectedAmount = 200_000

    await mockCCIPRouter.setFee(expectedAmount)

    const payload: IBridge.MessageSendStruct = {
      toChain: 80_001,
      receiver: ethers.ZeroAddress,
      data: '0x'
    }

    const requiredFee = await ccipAdapter.getFee(payload)

    expect(requiredFee).to.be.equal(expectedAmount)
  })
})
