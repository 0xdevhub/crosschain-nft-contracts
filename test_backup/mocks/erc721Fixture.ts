import { getContractAddress, getContractFactory } from '@/scripts/utils'
import { MockERC721__factory } from '@/typechain'

export async function deployMockERC721Fixture(name = 'MyNFT', symbol = 'MNFT') {
  const MockERC721 = await getContractFactory<MockERC721__factory>('MockERC721')
  const mockERC721 = await MockERC721.deploy(name, symbol)
  const mockERC721Address = await getContractAddress(mockERC721)

  return { mockERC721, mockERC721Address }
}
