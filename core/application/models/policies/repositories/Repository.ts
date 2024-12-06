import { DTO } from '../../../../../commons/dto/DTOCommon'
import { QueryInput } from './QueryTypes'

export default interface Repository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> {
  create(toCreateData: T): Promise<T>;
  update(updateData: Partial<T>): Promise<Partial<T>>;
  getItem(partitionKey: string, sortKey?: string): Promise<T | null>;
  query(
    queryInput: QueryInput<DbFields>,
    indexName?: string,
    requestedAttributes?: string[]
  ): Promise<{
    items: T[];
    lastEvaluatedKey?: Record<string, unknown>;
  }>;
  delete(partitionKey: string, sortKey?: string): Promise<void>;
}
