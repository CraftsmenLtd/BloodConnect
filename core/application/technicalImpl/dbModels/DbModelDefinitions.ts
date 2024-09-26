import { DTO } from '@commons/dto/DTOCommon'

interface DbModel {}

export type HasTimeLog = {
  createdAt: string;
  updatedAt?: string;
}

export interface DbModelDtoAdapter<Dto extends DTO, DbFields = Record<string, unknown>> {
  fromDto(userDto: Dto): DbFields;
  toDto(dbFields: DbFields): Dto;
}

export interface SqlModel extends DbModel {
  getId(): string;
}

export type DbIndex<DbFields extends Record<string, unknown>> = { partitionKey: keyof DbFields; sortKey?: keyof DbFields }
export type IndexType = 'GSI' | 'LSI'
export type IndexDefinitions<DbFields extends Record<string, unknown>> = Partial<Record<IndexType, Record<string, DbIndex<DbFields>>>>

export interface NosqlModel<DbFields extends Record<string, unknown>> extends DbModel {
  getIndexDefinitions(): IndexDefinitions<DbFields>;
  getPrimaryIndex(): DbIndex<DbFields>;
  getIndex(indexType: IndexType, indexName: string): DbIndex<DbFields> | undefined;
}
