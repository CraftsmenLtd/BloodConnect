import { DonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'
import { DbModelDtoAdapter, HasTimeLog, NosqlModel, IndexDefinitions, DbIndex, IndexType } from './DbModelDefinitions'

export const BLOOD_REQUEST_PK_PREFIX = 'BLOOD_REQ'
export const BLOOD_REQUEST_LSISK_PREFIX = 'STATUS'

export type DonationFields = Omit<DonationDTO, 'id' | 'seekerId'> & HasTimeLog & {
  PK: `${typeof BLOOD_REQUEST_PK_PREFIX}#${string}`;
  SK: `${typeof BLOOD_REQUEST_PK_PREFIX}#${string}#${string}`;
  LSI1SK: `${typeof BLOOD_REQUEST_LSISK_PREFIX}#${string}#${string}`;
}

export class BloodDonationModel implements NosqlModel<DonationFields>, DbModelDtoAdapter<DonationDTO, DonationFields> {
  getIndexDefinitions(): IndexDefinitions<DonationFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<DonationFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<DonationFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(donationDto: DonationDTO): DonationFields {
    const { seekerId, id, ...remainingDonationData } = donationDto
    // eslint-disable-next-line no-console
    console.log('BloodDonationModel.ts - fromDto - donationDto', donationDto)
    // eslint-disable-next-line no-console
    console.log('BloodDonationModel.ts - fromDto - remainingDonationData', remainingDonationData)
    const postCreationDate = remainingDonationData.createdAt ?? new Date().toISOString()
    // eslint-disable-next-line no-console
    console.log('BloodDonationModel.ts - fromDto - postCreationDate', postCreationDate)
    return {
      PK: `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
      SK: `${BLOOD_REQUEST_PK_PREFIX}#${postCreationDate}#${id}`,
      LSI1SK: `${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#${id}`,
      ...remainingDonationData,
      createdAt: postCreationDate
    }
  }

  toDto(dbFields: DonationFields): DonationDTO {
    const { PK, SK, createdAt, ...remainingDonationFields } = dbFields
    // eslint-disable-next-line no-console
    console.log('BloodDonationModel.ts - dbFields', dbFields)
    // eslint-disable-next-line no-console
    console.log('BloodDonationModel.ts - createdAt', createdAt)
    // eslint-disable-next-line no-console
    console.log('BloodDonationModel.ts - remainingDonationFields', remainingDonationFields)
    return { ...remainingDonationFields, id: SK.replace(`${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#`, ''), seekerId: PK.replace(`${BLOOD_REQUEST_PK_PREFIX}#`, ''), createdAt }
  }
}
