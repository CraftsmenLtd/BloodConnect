import type { DonorSearchDTO } from 'commons/dto/DonationDTO';
import { DONOR_SEARCH_PK_PREFIX, DonorSearchModel } from '../ddbModels/DonorSearchModel';
import type { DonorSearchFields } from '../ddbModels/DonorSearchModel';
import DynamoDbTableOperations from './DynamoDbTableOperations';
import type DonorSearchRepository from '../../../../application/models/policies/repositories/DonorSearchRepository';

export default class DonorSearchDynamoDbOperations extends DynamoDbTableOperations<
  DonorSearchDTO,
  DonorSearchFields,
  DonorSearchModel
> implements DonorSearchRepository {
  constructor(tableName: string, region: string) {
    super(new DonorSearchModel(), tableName, region)
  }

  async getDonorSearchItem(
    seekerId: string,
    requestPostId: string,
    createdAt: string
  ): Promise<DonorSearchDTO | null> {
    return super.getItem(
      `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
      `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${requestPostId}`
    )
  }
}
