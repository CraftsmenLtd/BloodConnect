import { DTO } from '../../../../../commons/dto/DTOCommon'

export interface QueryParams {
  keyConditionExpression: string;
  expressionAttributeValues: Record<string, any>;
}

export default interface Repository<T extends DTO> {
  create(toCreateData: T): Promise<T>;
  update(updateData: Partial<T>): Promise<Partial<T>>;
  getItem(partitionKey: string, sortKey?: string): Promise<T | null>;
  query(params: QueryParams): Promise<T[]>;
}
