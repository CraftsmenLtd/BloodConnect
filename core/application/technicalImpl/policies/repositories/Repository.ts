import { DTO } from '../../../../../commons/dto/DTOCommon'

export default interface Repository<T extends DTO> {
  create(toCreateData: T): Promise<T>;
  update(updateData: Partial<T>): Promise<Partial<T>>;
  getItem(partitionKey: string, sortKey?: string): Promise<T | null>;
}
