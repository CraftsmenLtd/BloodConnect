import DynamoDbTableOperations from './DynamoDbTableOperations'
import type { DTO } from '../../../../../commons/dto/DTOCommon'
import type {
  NosqlModel,
  DbModelDtoAdapter
} from '../../../../application/models/dbModels/DbModelDefinitions'

export default class DonationRecordDynamoDbOperations<
  Dto extends DTO,
  DbFields extends Record<string, unknown>,
  ModelAdapter extends NosqlModel<DbFields> & DbModelDtoAdapter<Dto, DbFields>
> extends DynamoDbTableOperations<Dto, DbFields, ModelAdapter> {
}
