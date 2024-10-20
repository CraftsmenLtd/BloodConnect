import { DonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'
import { DbModelDtoAdapter, HasTimeLog, NosqlModel, IndexDefinitions, DbIndex, IndexType } from './DbModelDefinitions'

export const BLOOD_REQUEST_PK_PREFIX = 'BLOOD_REQ'
export const BLOOD_REQUEST_LSISK_PREFIX = 'STATUS'

export type DonationFields = Omit<DonationDTO, 'id' | 'seekerId'> & HasTimeLog & {
  PK: `${typeof BLOOD_REQUEST_PK_PREFIX}#${string}`;
  SK: `${typeof BLOOD_REQUEST_PK_PREFIX}#${string}`;
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
    return {
      PK: `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
      SK: `${BLOOD_REQUEST_PK_PREFIX}#${id}`,
      LSI1SK: `${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#${id}`,
      ...remainingDonationData,
      createdAt: new Date().toISOString()
    }
  }

  toDto(dbFields: DonationFields): DonationDTO {
    const { PK, SK, createdAt, ...remainingDonationFields } = dbFields
    return { ...remainingDonationFields, id: SK.replace(`${BLOOD_REQUEST_PK_PREFIX}#`, ''), seekerId: PK.replace(`${BLOOD_REQUEST_PK_PREFIX}#`, '') }
  }
}
