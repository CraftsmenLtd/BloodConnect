import { ThrottlingRepository } from '../../../../application/technicalImpl/policies/repositories/ThrottlingRepository'
import { BLOOD_REQUEST_PK_PREFIX, BloodDonationModel, DonationFields } from '../../../../application/technicalImpl/dbModels/BloodDonationModel'
import { DonationDTO } from '@commons/dto/DonationDTO'
import DynamoDbTableOperations from './DynamoDbTableOperations'

export class BloodRequestThrottlingOperations extends DynamoDbTableOperations<DonationDTO, DonationFields, BloodDonationModel> implements ThrottlingRepository {
  constructor() {
    super(new BloodDonationModel())
  }

  async getDailyRequestCount(seekerId: string, datePrefix: string): Promise<number> {
    const queryParams = {
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      expressionAttributeValues: {
        ':pk': `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
        ':sk': `${BLOOD_REQUEST_PK_PREFIX}#${datePrefix}`
      }
    }

    const items = await this.query(queryParams)
    // eslint-disable-next-line no-console
    console.log('items BloodRequestThrottlingOperations', items)
    // eslint-disable-next-line no-console
    console.log('items BloodRequestThrottlingOperations', items.length)
    // eslint-disable-next-line no-console
    console.log('items BloodRequestThrottlingOperations', items?.length ?? 0)
    // return items.length
    return items?.length ?? 0
  }
}
