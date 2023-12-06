import { getContractAddress, getContractFactory } from '@/scripts/utils'
import { MockAdapter__factory } from '@/typechain'

export async function deployMockAdapterFixture() {
  const MockAdapter =
    await getContractFactory<MockAdapter__factory>('MockAdapter')
  const mockAdapter = await MockAdapter.deploy()
  const mockAdapterAddress = await getContractAddress(mockAdapter)

  return { mockAdapter, mockAdapterAddress }
}
