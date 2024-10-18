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

const removeItem = async(key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key)
  } catch (error) {
    throw new Error(`Failed to remove ${key}`)
  }
}

const clearStorage = async(): Promise<void> => {
  try {
    await AsyncStorage.clear()
  } catch (error) {
    throw new Error('Failed to clear storage')
  }
}

export default {
  storeItem,
  getItem,
  removeItem,
  clearStorage
}
