import MockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'

jest.mock('@react-native-async-storage/async-storage', () => MockAsyncStorage)

jest.mock(
  'expo-secure-store',
  () => {
    const store = new Map()

    return {
      setItemAsync: jest.fn(async (key, value) => { store.set(key, value) }),
      getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
      deleteItemAsync: jest.fn(async (key) => { store.delete(key) })
    }
  },
  { virtual: true }
)
