import DynamoDbTableOperations from './DynamoDbTableOperations'
import { DTO } from '../../../../../commons/dto/DTOCommon'
import {
  NosqlModel,
  DbModelDtoAdapter
} from '../../../../application/models/dbModels/DbModelDefinitions'
import { BLOOD_REQUEST_PK_PREFIX } from '../../../../application/models/dbModels/BloodDonationModel'

export default class BloodDonationDynamoDbOperations<
  Dto extends DTO,
  DbFields extends Record<string, unknown>,
  ModelAdapter extends NosqlModel<DbFields> & DbModelDtoAdapter<Dto, DbFields>
> extends DynamoDbTableOperations<Dto, DbFields, ModelAdapter> {
  async getDonationRequest(
    seekerId: string,
    requestPostId: string,
    createdAt: string
  ): Promise<Dto | null> {
    const item = await super.getItem(
      `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
      `${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#${requestPostId}`
    )
    return item
  }
}
