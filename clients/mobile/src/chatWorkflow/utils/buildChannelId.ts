import * as Crypto from 'expo-crypto'

const CHANNEL_ID_LENGTH = 32

/**
 * Mirrors the backend deterministic channel id
 * (sha256 hex of `seekerId#requestPostId#donorId`, truncated) so the client can
 * open the correct chat room without a round-trip.
 */
export const buildChannelId = async(
  seekerId: string,
  requestPostId: string,
  donorId: string
): Promise<string> => {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${seekerId}#${requestPostId}#${donorId}`
  )

  return digest.slice(0, CHANNEL_ID_LENGTH)
}
