import AsyncStorage from '@react-native-async-storage/async-storage'

const storeItem = async <T>(key: string, value: T | undefined): Promise<void> => {
  try {
    if (value === undefined) {
      throw new Error(`Value for key "${key}" is undefined`)
    }
    const valueToStore = typeof value === 'string' ? value : JSON.stringify(value)
    await AsyncStorage.setItem(key, valueToStore)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    throw new Error(`Failed to store ${key}: ${errorMessage}`)
  }
}

const getItem = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await AsyncStorage.getItem(key)
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      return JSON.parse(value) as T
    }
    return value as T
  } catch (error) {
    throw new Error(`Failed to get ${key}`)
  }
}

const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key)
  } catch (error) {
    throw new Error(`Failed to remove ${key}`)
  }
}

const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear()
  } catch (error) {
    throw new Error('Failed to clear storage')
  }
}

interface KeySet {
  filter(key: string): KeySet;
  getKeys(): readonly string[];
  remove(): Promise<void>;
}
const createKeySet = (keys: readonly string[]): KeySet => {
  const filter = (key: string): KeySet => {
    return createKeySet(keys.filter(k => k !== key))
  }

  const remove = async (): Promise<void> => {
    await removeKeys(keys)
  }

  return {
    filter,
    getKeys: () => keys,
    remove
  }
}

const getAllKeys = async (): Promise<KeySet> => {
  try {
    const keys = await AsyncStorage.getAllKeys()
    return createKeySet(keys)
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to get all keys: ${error.message}`)
    }
    throw new Error('Failed to get all keys: An unknown error occurred')
  }
}

const removeKeys = async (keysToRemove: readonly string[]): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(keysToRemove)
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to remove keys: ${error.message}`)
    }
    throw new Error('Failed to remove keys: An unknown error occurred')
  }
}

export default {
  storeItem,
  getItem,
  removeItem,
  clearStorage,
  getAllKeys
}
