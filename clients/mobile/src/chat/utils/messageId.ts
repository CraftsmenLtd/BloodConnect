// Generates a client-side UUID v4 used as the chat message idempotency key.
// Relies on crypto.getRandomValues (polyfilled in React Native by
// react-native-get-random-values, present in node/jest) and falls back to
// Math.random so a missing polyfill never breaks message sending.

const UUID_BYTE_LENGTH = 16
const VERSION_BYTE_INDEX = 6
const VARIANT_BYTE_INDEX = 8
const BYTE_RANGE = 256
const HEX_RADIX = 16
const PADDED_HEX_LENGTH = 2

type CryptoLike = { getRandomValues: (array: Uint8Array) => Uint8Array }

const resolveCrypto = (): CryptoLike | undefined => {
  const candidate = (global as unknown as { crypto?: CryptoLike }).crypto

  return candidate?.getRandomValues !== undefined ? candidate : undefined
}

const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length)
  const cryptoSource = resolveCrypto()
  if (cryptoSource !== undefined) {
    return cryptoSource.getRandomValues(bytes)
  }
  for (let index = 0; index < length; index += 1) {
    bytes[index] = Math.floor(Math.random() * BYTE_RANGE)
  }

  return bytes
}

const toHex = (byte: number): string => byte.toString(HEX_RADIX).padStart(PADDED_HEX_LENGTH, '0')

export const generateMessageId = (): string => {
  const bytes = randomBytes(UUID_BYTE_LENGTH)
  bytes[VERSION_BYTE_INDEX] = (bytes[VERSION_BYTE_INDEX] & 0x0f) | 0x40
  bytes[VARIANT_BYTE_INDEX] = (bytes[VARIANT_BYTE_INDEX] & 0x3f) | 0x80
  const hex = Array.from(bytes, toHex).join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
