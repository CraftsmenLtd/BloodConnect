import { DTO } from '../../../../../commons/dto/DTOCommon'

export default interface Repository<T extends DTO> {
  create(toCreateData: T): Promise<T>;
  update(updateData: T): Promise<Partial<T>>;
}
