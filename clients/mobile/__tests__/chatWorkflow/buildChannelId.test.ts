import { buildChannelId } from '../../src/chatWorkflow/utils/buildChannelId'
import * as Crypto from 'expo-crypto'

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn()
}))

const mockDigest = Crypto.digestStringAsync as jest.Mock

describe('buildChannelId', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('hashes the triplet and truncates to 32 characters', async() => {
    mockDigest.mockResolvedValueOnce('a'.repeat(64))

    const channelId = await buildChannelId('seeker', 'request', 'donor')

    expect(mockDigest).toHaveBeenCalledWith('SHA-256', 'seeker#request#donor')
    expect(channelId).toBe('a'.repeat(32))
    expect(channelId).toHaveLength(32)
  })

  it('is deterministic for the same triplet', async() => {
    mockDigest.mockResolvedValue('b'.repeat(64))

    const first = await buildChannelId('s', 'r', 'd')
    const second = await buildChannelId('s', 'r', 'd')

    expect(first).toBe(second)
  })
})
