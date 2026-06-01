import * as SecureStore from 'expo-secure-store'
import type { KeyValueStorageInterface } from 'aws-amplify/utils'

const CHUNK_SIZE = 2000
const CHUNK_COUNT_SUFFIX = '__chunkCount'
const MANIFEST_KEY = '__bcSecureKeysManifest'

const sanitizeKey = (key: string): string => key.replace(/[^A-Za-z0-9._-]/g, '_')

const loadManifest = async(): Promise<Set<string>> => {
  const raw = await SecureStore.getItemAsync(MANIFEST_KEY)
  if (raw === null) return new Set()
  try {
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

const saveManifest = async(keys: Set<string>): Promise<void> => {
  await SecureStore.setItemAsync(MANIFEST_KEY, JSON.stringify(Array.from(keys)))
}

const removeRawKey = async(safeKey: string): Promise<void> => {
  const chunkCountRaw = await SecureStore.getItemAsync(`${safeKey}${CHUNK_COUNT_SUFFIX}`)
  if (chunkCountRaw === null) {
    await SecureStore.deleteItemAsync(safeKey)

    return
  }
  const chunkCount = Number.parseInt(chunkCountRaw, 10)
  await Promise.all(
    Array.from({ length: chunkCount }, async(_, idx) =>
      SecureStore.deleteItemAsync(`${safeKey}_${idx}`))
  )
  await SecureStore.deleteItemAsync(`${safeKey}${CHUNK_COUNT_SUFFIX}`)
}

const setItem = async(key: string, value: string): Promise<void> => {
  const safeKey = sanitizeKey(key)
  await removeRawKey(safeKey)

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(safeKey, value)
  } else {
    const chunks: string[] = []
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE))
    }
    await Promise.all(
      chunks.map(async(chunk, idx) => SecureStore.setItemAsync(`${safeKey}_${idx}`, chunk))
    )
    await SecureStore.setItemAsync(`${safeKey}${CHUNK_COUNT_SUFFIX}`, String(chunks.length))
  }

  const manifest = await loadManifest()
  manifest.add(key)
  await saveManifest(manifest)
}

const getItem = async(key: string): Promise<string | null> => {
  const safeKey = sanitizeKey(key)
  const chunkCountRaw = await SecureStore.getItemAsync(`${safeKey}${CHUNK_COUNT_SUFFIX}`)
  if (chunkCountRaw === null) {
    return SecureStore.getItemAsync(safeKey)
  }
  const chunkCount = Number.parseInt(chunkCountRaw, 10)
  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, async(_, idx) =>
      SecureStore.getItemAsync(`${safeKey}_${idx}`))
  )
  if (chunks.some((chunk) => chunk === null)) return null

  return chunks.join('')
}

const removeItem = async(key: string): Promise<void> => {
  await removeRawKey(sanitizeKey(key))
  const manifest = await loadManifest()
  if (manifest.delete(key)) {
    await saveManifest(manifest)
  }
}

const clear = async(): Promise<void> => {
  const manifest = await loadManifest()
  await Promise.all(
    Array.from(manifest, async(key) => removeRawKey(sanitizeKey(key)))
  )
  await SecureStore.deleteItemAsync(MANIFEST_KEY)
}

export const secureKeyValueStorage: KeyValueStorageInterface = {
  setItem,
  getItem,
  removeItem,
  clear
}
