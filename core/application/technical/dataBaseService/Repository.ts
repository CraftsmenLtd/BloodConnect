export interface Repository<T, U> {
  createItem(item: T): Promise<U>;
}
