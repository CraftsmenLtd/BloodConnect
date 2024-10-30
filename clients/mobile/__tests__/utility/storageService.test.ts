import AsyncStorage from '@react-native-async-storage/async-storage'
import storageUtil from '../../src/utility/storageService'

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}))

describe('storageUtil', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('storeItem', () => {
    const key = 'testKey'

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should store a valid item', async() => {
      const valueToStore = { test: 'data' }

      await storageUtil.storeItem(key, valueToStore)

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(valueToStore))
    })

    it('should throw an error when value is undefined', async() => {
      await expect(storageUtil.storeItem(key, undefined)).rejects.toThrow(`Value for key "${key}" is undefined`)
    })

    it('should throw an error when AsyncStorage.setItem fails', async() => {
      const valueToStore = { test: 'data' };
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('AsyncStorage error'))

      await expect(storageUtil.storeItem(key, valueToStore)).rejects.toThrow(`Failed to store ${key}: AsyncStorage error`)
    })

    it('should throw an error with a generic message for unknown errors', async() => {
      const valueToStore = { test: 'data' };
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue('Unknown error')

      await expect(storageUtil.storeItem(key, valueToStore)).rejects.toThrow(`Failed to store ${key}: An unknown error occurred`)
    })
  })

  describe('getItem', () => {
    it('should get a string value', async() => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('testValue')
      const value = await storageUtil.getItem<string>('testKey')
      expect(value).toBe('testValue')
    })

    it('should get an object by parsing JSON string', async() => {
      const obj = { name: 'John', age: 30 };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(obj))
      const value = await storageUtil.getItem<typeof obj>('testKey')
      expect(value).toEqual(obj)
    })

    it('should return null if no value exists', async() => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      const value = await storageUtil.getItem('nonexistentKey')
      expect(value).toBeNull()
    })

    it('should throw an error when AsyncStorage.getItem fails', async() => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('getItem failed'))
      await expect(storageUtil.getItem('testKey')).rejects.toThrow('Failed to get testKey')
    })
  })

  describe('removeItem', () => {
    it('should remove an item', async() => {
      await storageUtil.removeItem('testKey')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('testKey')
    })

    it('should throw an error when AsyncStorage.removeItem fails', async() => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('removeItem failed'))
      await expect(storageUtil.removeItem('testKey')).rejects.toThrow('Failed to remove testKey')
    })
  })

  describe('clearStorage', () => {
    it('should clear all storage', async() => {
      await storageUtil.clearStorage()
      expect(AsyncStorage.clear).toHaveBeenCalled()
    })

    it('should throw an error when AsyncStorage.clear fails', async() => {
      (AsyncStorage.clear as jest.Mock).mockRejectedValueOnce(new Error('clear failed'))
      await expect(storageUtil.clearStorage()).rejects.toThrow('Failed to clear storage')
    })
  })
})
