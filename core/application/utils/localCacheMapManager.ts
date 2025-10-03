export class LocalCacheMapManager<K, V> {
  private readonly cache: Map<K, V>
  private readonly maxSize: number

  constructor(size: number) {
    if (!Number.isInteger(size)) {
      throw new Error('Size must be an integer!')
    }
    this.cache = new Map()
    this.maxSize = size
  }

  set(key: K, value: V): void {
    if (this.cache.size === this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }
    this.cache.set(key, value)
  }

  get(key: K): V | undefined {
    return this.cache.get(key)
  }
}
