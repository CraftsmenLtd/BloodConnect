import { DTO } from '@commons/dto/DtoCommon'

export default interface Repository<T extends DTO> {
  create(toCreateData: T): Promise<T>;
}
