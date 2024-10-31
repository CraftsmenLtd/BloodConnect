const AsyncStorage = {
  setItem: jest.fn(async() => Promise.resolve()),
  getItem: jest.fn(async() => Promise.resolve(null)),
  removeItem: jest.fn(async() => Promise.resolve()),
  clear: jest.fn(async() => Promise.resolve())
}

export default AsyncStorage
