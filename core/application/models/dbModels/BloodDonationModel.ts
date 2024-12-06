import { DonationDTO } from '../../../../commons/dto/DonationDTO'
import {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  IndexDefinitions,
  DbIndex,
  IndexType
} from './DbModelDefinitions'

export const BLOOD_REQUEST_PK_PREFIX = 'BLOOD_REQ'
export const BLOOD_REQUEST_LSI1SK_PREFIX = 'STATUS'

export type DonationFields = Omit<DonationDTO, 'id' | 'seekerId'> &
HasTimeLog & {
  PK: `${typeof BLOOD_REQUEST_PK_PREFIX}#${string}`;
  SK: `${typeof BLOOD_REQUEST_PK_PREFIX}#${string}#${string}`;
  GSI1PK: `CITY#${string}#STATUS#${string}`;
  GSI1SK: `BG#${string}`;
  LSI1SK: `${typeof BLOOD_REQUEST_LSI1SK_PREFIX}#${string}#${string}`;
}

export class BloodDonationModel
implements NosqlModel<DonationFields>, DbModelDtoAdapter<DonationDTO, DonationFields> {
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
    const postCreationDate = remainingDonationData.createdAt ?? new Date().toISOString()
    return {
      PK: `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
      SK: `${BLOOD_REQUEST_PK_PREFIX}#${postCreationDate}#${id}`,
      GSI1PK: `CITY#${remainingDonationData.city}#STATUS#${remainingDonationData.status}`,
      GSI1SK: `BG#${remainingDonationData.requestedBloodGroup}`,
      LSI1SK: `${BLOOD_REQUEST_LSI1SK_PREFIX}#${remainingDonationData.status}#${id}`,
      ...remainingDonationData,
      createdAt: postCreationDate
    }
  }

  toDto(dbFields: DonationFields): DonationDTO {
    const { PK, SK, LSI1SK, createdAt, ...remainingDonationFields } = dbFields
    return {
      ...remainingDonationFields,
      id: SK.replace(`${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#`, ''),
      seekerId: PK.replace(`${BLOOD_REQUEST_PK_PREFIX}#`, ''),
      createdAt
    }
  }
}
