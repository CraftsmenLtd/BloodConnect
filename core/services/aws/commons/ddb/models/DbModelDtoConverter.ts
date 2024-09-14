import { DTO } from '@commons/dto/DtoCommon'

export default interface DbModelDtoConverter<Dto extends DTO, DbFields = Record<string, unknown>> {
  fromDto(userDto: Dto): DbFields;
  toDto(dbFields: DbFields): Dto;
}
