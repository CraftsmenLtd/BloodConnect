export interface UserRepository<T, R> {
  createUserItem(params: T): Promise<R>;
}
