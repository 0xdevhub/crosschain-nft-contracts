import { getContractAddress, getContractFactory } from '@/scripts/utils'
import { MockERC20__factory } from '@/typechain'

export async function deployMockERC20Fixture(name?: string, symbol?: string) {
  const MockERC20 = await getContractFactory<MockERC20__factory>('MockERC20')
  const mockERC20 = await MockERC20.deploy(
    name || 'erc20token',
    symbol || 'erc20symbol'
  )
  const mockERC20Address = await getContractAddress(mockERC20)

  return { mockERC20, mockERC20Address }
}
