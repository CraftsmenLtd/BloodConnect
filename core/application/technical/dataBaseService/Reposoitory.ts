export interface Repository<T> {
  createItem(item: T): Promise<T>;
}
