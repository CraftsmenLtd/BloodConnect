import { DTO } from '@commons/dto/DTOCommon'

export default interface DbModelDtoConverter<Dto extends DTO, DbFields = Record<string, unknown>> {
  fromDto(userDto: Dto): DbFields;
  toDto(dbFields: DbFields): Dto;
}
