import type { DTO } from '../../../../../commons/dto/DTOCommon'
// eslint-disable-next-line @typescript-eslint/ban-types
type DbModel = {};

export type HasTimeLog = {
  createdAt?: string;
  updatedAt?: string;
}

export type DbModelDtoAdapter<Dto extends DTO, DbFields = Record<string, unknown>> = {
  fromDto(dto: Dto): DbFields;
  toDto(dbFields: DbFields): Dto;
}

export type SqlModel = {
  getId(): string;
} & DbModel

export type DbIndex<DbFields extends Record<string, unknown>> = { partitionKey: keyof DbFields; sortKey?: keyof DbFields }
export type IndexType = 'GSI' | 'LSI'
export type IndexDefinitions<DbFields extends Record<string, unknown>> = Partial<Record<IndexType, Record<string, DbIndex<DbFields>>>>

export type NosqlModel<DbFields extends Record<string, unknown>> = {
  getIndexDefinitions(): IndexDefinitions<DbFields>;
  getPrimaryIndex(): DbIndex<DbFields>;
  getIndex(indexType: IndexType, indexName: string): DbIndex<DbFields> | undefined;
} & DbModel
