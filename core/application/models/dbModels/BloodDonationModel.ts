import { DonationDTO, BloodGroup } from '../../../../commons/dto/DonationDTO'
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
  GSI1PK?: `CITY#${string}#STATUS#${string}`;
  GSI1SK?: `BG#${string}`;
  LSI1SK?: `${typeof BLOOD_REQUEST_LSI1SK_PREFIX}#${string}#${string}`;
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
    const { seekerId, id, createdAt, ...remainingDonationData } = donationDto

    const data: DonationFields = {
      PK: `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
      SK: `${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#${id}`,
      ...remainingDonationData,
      createdAt
    }

    if (remainingDonationData.city !== undefined && remainingDonationData.status !== undefined) {
      data.GSI1PK = `CITY#${remainingDonationData.city}#STATUS#${remainingDonationData.status}`
    }
    if ((remainingDonationData.requestedBloodGroup as BloodGroup) !== undefined) {
      data.GSI1SK = `BG#${remainingDonationData.requestedBloodGroup}#${createdAt}`
    }
    if (remainingDonationData.status !== undefined) {
      data.LSI1SK = `${BLOOD_REQUEST_LSI1SK_PREFIX}#${remainingDonationData.status}#${id}`
    }
    return data
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
