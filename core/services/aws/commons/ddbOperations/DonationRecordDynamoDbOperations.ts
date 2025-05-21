import DynamoDbTableOperations from './DynamoDbTableOperations'
import type { DonationRecordDTO } from 'commons/dto/DonationDTO'
import type DonationRecordRepository from 'core/application/models/policies/repositories/DonationRecordRepository'
import { DonationRecordModel } from '../ddbModels/DonationRecordModel'
import type { DonationRecordFields } from '../ddbModels/DonationRecordModel'

export default class DonationRecordDynamoDbOperations extends DynamoDbTableOperations<
  DonationRecordDTO,
  DonationRecordFields,
  DonationRecordModel
> implements DonationRecordRepository {
  constructor(tableName: string, region: string) {
    super(new DonationRecordModel(), tableName, region)
  }
}
