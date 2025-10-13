import { LocalCacheMapManager } from '../../utils/localCacheMapManager'

describe('LocalCacheMapManager', () => {
  describe('constructor', () => {
    test('should create cache manager with valid integer size', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(10)
      expect(cacheManager).toBeInstanceOf(LocalCacheMapManager)
    })

    test('should throw error when size is not an integer', () => {
      expect(() => {
        new LocalCacheMapManager<string, string>(10.5)
      }).toThrow('Size must be an integer!')
    })

    test('should throw error when size is a float', () => {
      expect(() => {
        new LocalCacheMapManager<string, string>(3.14)
      }).toThrow('Size must be an integer!')
    })

    test('should accept size of 1', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(1)
      expect(cacheManager).toBeInstanceOf(LocalCacheMapManager)
    })

    test('should accept large integer size', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(10000)
      expect(cacheManager).toBeInstanceOf(LocalCacheMapManager)
    })

    test('should accept size of 0', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(0)
      expect(cacheManager).toBeInstanceOf(LocalCacheMapManager)
    })
  })

  describe('set and get', () => {
    test('should store and retrieve value', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(5)
      cacheManager.set('key1', 'value1')

      const result = cacheManager.get('key1')
      expect(result).toBe('value1')
    })

    test('should store and retrieve complex objects', () => {
      const cacheManager = new LocalCacheMapManager<string, { name: string; age: number }>(5)
      const data = { name: 'Alice', age: 25 }

      cacheManager.set('user1', data)

      const result = cacheManager.get('user1')
      expect(result).toEqual(data)
    })

    test('should return undefined for non-existent key', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(5)
      const result = cacheManager.get('nonexistent')
      expect(result).toBeUndefined()
    })

    test('should overwrite existing key', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(5)
      cacheManager.set('key1', 'value1')
      cacheManager.set('key1', 'value2')

      const result = cacheManager.get('key1')
      expect(result).toBe('value2')
    })

    test('should handle multiple keys', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(10)
      cacheManager.set('key1', 'value1')
      cacheManager.set('key2', 'value2')
      cacheManager.set('key3', 'value3')

      expect(cacheManager.get('key1')).toBe('value1')
      expect(cacheManager.get('key2')).toBe('value2')
      expect(cacheManager.get('key3')).toBe('value3')
    })

    test('should handle null values', () => {
      const cacheManager = new LocalCacheMapManager<string, string | null>(5)
      cacheManager.set('key1', null)

      const result = cacheManager.get('key1')
      expect(result).toBeNull()
    })

    test('should handle undefined values', () => {
      const cacheManager = new LocalCacheMapManager<string, string | undefined>(5)
      cacheManager.set('key1', undefined)

      const result = cacheManager.get('key1')
      expect(result).toBeUndefined()
    })

    test('should handle empty string as key', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(5)
      cacheManager.set('', 'empty-key-value')

      const result = cacheManager.get('')
      expect(result).toBe('empty-key-value')
    })

    test('should handle empty string as value', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(5)
      cacheManager.set('key1', '')

      const result = cacheManager.get('key1')
      expect(result).toBe('')
    })

    test('should handle numeric keys', () => {
      const cacheManager = new LocalCacheMapManager<number, string>(5)
      cacheManager.set(123, 'numeric-key')
      cacheManager.set(456, 'another-numeric-key')

      expect(cacheManager.get(123)).toBe('numeric-key')
      expect(cacheManager.get(456)).toBe('another-numeric-key')
    })

    test('should handle boolean values', () => {
      const cacheManager = new LocalCacheMapManager<string, boolean>(5)
      cacheManager.set('key1', true)
      cacheManager.set('key2', false)

      expect(cacheManager.get('key1')).toBe(true)
      expect(cacheManager.get('key2')).toBe(false)
    })

    test('should handle array values', () => {
      const cacheManager = new LocalCacheMapManager<string, number[]>(5)
      const array = [1, 2, 3, 4, 5]
      cacheManager.set('key1', array)

      const result = cacheManager.get('key1')
      expect(result).toEqual(array)
    })

    test('should handle nested objects', () => {
      const cacheManager = new LocalCacheMapManager<string, any>(5)
      const nested = {
        user: {
          name: 'Bob',
          profile: {
            age: 30,
            city: 'Dhaka'
          }
        }
      }
      cacheManager.set('key1', nested)

      const result = cacheManager.get('key1')
      expect(result).toEqual(nested)
    })
  })

  describe('cache eviction by max size', () => {
    test('should evict oldest entry when max size reached', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(2)

      cacheManager.set('key1', 'value1')
      cacheManager.set('key2', 'value2')
      cacheManager.set('key3', 'value3')

      expect(cacheManager.get('key1')).toBeUndefined()
      expect(cacheManager.get('key2')).toBe('value2')
      expect(cacheManager.get('key3')).toBe('value3')
    })

    test('should evict multiple oldest entries when needed', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(3)

      cacheManager.set('key1', 'value1')
      cacheManager.set('key2', 'value2')
      cacheManager.set('key3', 'value3')
      cacheManager.set('key4', 'value4')
      cacheManager.set('key5', 'value5')

      expect(cacheManager.get('key1')).toBeUndefined()
      expect(cacheManager.get('key2')).toBeUndefined()
      expect(cacheManager.get('key3')).toBe('value3')
      expect(cacheManager.get('key4')).toBe('value4')
      expect(cacheManager.get('key5')).toBe('value5')
    })

    test('should handle max size of 1', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(1)

      cacheManager.set('key1', 'value1')
      expect(cacheManager.get('key1')).toBe('value1')

      cacheManager.set('key2', 'value2')
      expect(cacheManager.get('key1')).toBeUndefined()
      expect(cacheManager.get('key2')).toBe('value2')

      cacheManager.set('key3', 'value3')
      expect(cacheManager.get('key2')).toBeUndefined()
      expect(cacheManager.get('key3')).toBe('value3')
    })

    test('should maintain insertion order for eviction', () => {
      const cacheManager = new LocalCacheMapManager<string, number>(3)

      cacheManager.set('a', 1)
      cacheManager.set('b', 2)
      cacheManager.set('c', 3)

      // This should evict 'a' (oldest)
      cacheManager.set('d', 4)

      expect(cacheManager.get('a')).toBeUndefined()
      expect(cacheManager.get('b')).toBe(2)
      expect(cacheManager.get('c')).toBe(3)
      expect(cacheManager.get('d')).toBe(4)

      // This should evict 'b' (now oldest)
      cacheManager.set('e', 5)

      expect(cacheManager.get('b')).toBeUndefined()
      expect(cacheManager.get('c')).toBe(3)
      expect(cacheManager.get('d')).toBe(4)
      expect(cacheManager.get('e')).toBe(5)
    })

    test('should not evict when updating existing key', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(2)

      cacheManager.set('key1', 'value1')
      cacheManager.set('key2', 'value2')

      // Update existing key - should not trigger eviction
      cacheManager.set('key1', 'updated-value1')

      expect(cacheManager.get('key1')).toBe('updated-value1')
      expect(cacheManager.get('key2')).toBe('value2')
    })

    test('should handle max size of 0', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(0)

      cacheManager.set('key1', 'value1')

      // With size 0, the condition (size === maxSize) is true, but
      // the implementation still adds the item after eviction logic
      expect(cacheManager.get('key1')).toBe('value1')
    })

    test('should evict correctly with rapid insertions', () => {
      const cacheManager = new LocalCacheMapManager<number, string>(5)

      for (let i = 0; i < 10; i++) {
        cacheManager.set(i, `value${i}`)
      }

      // Only last 5 should remain
      expect(cacheManager.get(0)).toBeUndefined()
      expect(cacheManager.get(4)).toBeUndefined()
      expect(cacheManager.get(5)).toBe('value5')
      expect(cacheManager.get(9)).toBe('value9')
    })

    test('should handle large max size without eviction', () => {
      const cacheManager = new LocalCacheMapManager<string, string>(1000)

      for (let i = 0; i < 100; i++) {
        cacheManager.set(`key${i}`, `value${i}`)
      }

      // All should still be present
      expect(cacheManager.get('key0')).toBe('value0')
      expect(cacheManager.get('key50')).toBe('value50')
      expect(cacheManager.get('key99')).toBe('value99')
    })
  })

  describe('edge cases', () => {
    test('should handle objects as keys', () => {
      const cacheManager = new LocalCacheMapManager<object, string>(5)
      const keyObj1 = { id: 1 }
      const keyObj2 = { id: 2 }

      cacheManager.set(keyObj1, 'value1')
      cacheManager.set(keyObj2, 'value2')

      expect(cacheManager.get(keyObj1)).toBe('value1')
      expect(cacheManager.get(keyObj2)).toBe('value2')
    })

    test('should differentiate between different object keys', () => {
      const cacheManager = new LocalCacheMapManager<object, string>(5)
      const key1 = { id: 1 }
      const key2 = { id: 1 } // Same content, different object

      cacheManager.set(key1, 'value1')
      cacheManager.set(key2, 'value2')

      // Different object references
      expect(cacheManager.get(key1)).toBe('value1')
      expect(cacheManager.get(key2)).toBe('value2')
    })

    test('should handle Map as value', () => {
      const cacheManager = new LocalCacheMapManager<string, Map<string, number>>(5)
      const mapValue = new Map([['a', 1], ['b', 2]])

      cacheManager.set('key1', mapValue)

      const result = cacheManager.get('key1')
      expect(result).toBe(mapValue)
      expect(result?.get('a')).toBe(1)
    })

    test('should handle Set as value', () => {
      const cacheManager = new LocalCacheMapManager<string, Set<number>>(5)
      const setValue = new Set([1, 2, 3])

      cacheManager.set('key1', setValue)

      const result = cacheManager.get('key1')
      expect(result).toBe(setValue)
      expect(result?.has(2)).toBe(true)
    })

    test('should handle Date as value', () => {
      const cacheManager = new LocalCacheMapManager<string, Date>(5)
      const dateValue = new Date('2025-01-15')

      cacheManager.set('key1', dateValue)

      const result = cacheManager.get('key1')
      expect(result).toBe(dateValue)
      expect(result?.toISOString()).toBe('2025-01-15T00:00:00.000Z')
    })

    test('should maintain reference equality for objects', () => {
      const cacheManager = new LocalCacheMapManager<string, object>(5)
      const obj = { value: 'test' }

      cacheManager.set('key1', obj)

      const result = cacheManager.get('key1')
      expect(result).toBe(obj) // Same reference
      expect(result === obj).toBe(true)
    })

    test('should handle Symbol keys', () => {
      const cacheManager = new LocalCacheMapManager<symbol, string>(5)
      const sym1 = Symbol('key1')
      const sym2 = Symbol('key2')

      cacheManager.set(sym1, 'value1')
      cacheManager.set(sym2, 'value2')

      expect(cacheManager.get(sym1)).toBe('value1')
      expect(cacheManager.get(sym2)).toBe('value2')
    })
  })
})
