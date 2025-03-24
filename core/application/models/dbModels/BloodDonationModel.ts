import { GEO_PARTITION_PREFIX_LENGTH } from '../../../../commons/libs/constants/NoMagicNumbers'
import type { DonationDTO, BloodGroup } from '../../../../commons/dto/DonationDTO'
import type {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  IndexDefinitions,
  DbIndex,
  IndexType
} from './DbModelDefinitions'

export const BLOOD_REQUEST_PK_PREFIX = 'BLOOD_REQ'
export const BLOOD_REQUEST_LSI1SK_PREFIX = 'STATUS'

export type DonationFields = Omit<DonationDTO, 'requestPostId' | 'seekerId'> &
HasTimeLog & {
  PK: `${typeof BLOOD_REQUEST_PK_PREFIX}#${string}`;
  SK: `${typeof BLOOD_REQUEST_PK_PREFIX}#${string}#${string}`;
  GSI1PK?: `LOCATION#${string}#STATUS#${string}`;
  GSI1SK?: `${string}#BG#${string}`;
  LSI1SK?: `${typeof BLOOD_REQUEST_LSI1SK_PREFIX}#${string}#${string}`;
}

export class BloodDonationModel
implements NosqlModel<DonationFields>, DbModelDtoAdapter<DonationDTO, DonationFields> {
  getIndexDefinitions (): IndexDefinitions<DonationFields> {
    return {
      GSI: {
        GSI1: {
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        }
      }
    }
  }

  getPrimaryIndex (): DbIndex<DonationFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex (indexType: IndexType, indexName: string): DbIndex<DonationFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(donationDto: DonationDTO): DonationFields {
    const { seekerId, requestPostId, createdAt, ...remainingData } = donationDto

    const data: DonationFields = {
      PK: `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
      SK: `${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#${requestPostId}`,
      ...remainingData,
      createdAt
    }

    const geoPartition = remainingData.geohash.slice(0, GEO_PARTITION_PREFIX_LENGTH)

    if (remainingData.status !== undefined) {
      data.GSI1PK = `LOCATION#${remainingData.countryCode}-${geoPartition}#STATUS#${remainingData.status}`
    }
    if ((remainingData.requestedBloodGroup as BloodGroup) !== undefined) {
      data.GSI1SK = `${createdAt}#BG#${remainingData.requestedBloodGroup}`
    }
    if (remainingData.status !== undefined) {
      data.LSI1SK = `${BLOOD_REQUEST_LSI1SK_PREFIX}#${remainingData.status}#${requestPostId}`
    }
    return data
  }

  toDto (dbFields: DonationFields): DonationDTO {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, LSI1SK, createdAt, ...remainingDonationFields } = dbFields
    return {
      ...remainingDonationFields,
      requestPostId: SK.replace(`${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#`, ''),
      seekerId: PK.replace(`${BLOOD_REQUEST_PK_PREFIX}#`, ''),
      createdAt
    }
  }
}
