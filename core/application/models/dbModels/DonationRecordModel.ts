import { DonationRecordDTO } from '../../../../commons/dto/DonationDTO'
import {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  IndexDefinitions,
  DbIndex,
  IndexType
} from './DbModelDefinitions'

export const DONATION_RECORD_PK_PREFIX = 'DONATION'

export type DonationRecordFields = Omit<DonationRecordDTO, 'id' | 'donorId'> &
HasTimeLog & {
  PK: `${typeof DONATION_RECORD_PK_PREFIX}#${string}`;
  SK: `${typeof DONATION_RECORD_PK_PREFIX}#${string}`;
}

export class DonationRecordModel
implements
    NosqlModel<DonationRecordFields>,
    DbModelDtoAdapter<DonationRecordDTO, DonationRecordFields> {
  getIndexDefinitions(): IndexDefinitions<DonationRecordFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<DonationRecordFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<DonationRecordFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(DonationRecordDTO: DonationRecordDTO): DonationRecordFields {
    const { donorId, id, ...remainingDonationRecordData } = DonationRecordDTO
    const postCreationDate = remainingDonationRecordData.createdAt ?? new Date().toISOString()
    return {
      PK: `${DONATION_RECORD_PK_PREFIX}#${donorId}`,
      SK: `${DONATION_RECORD_PK_PREFIX}#${id}`,
      ...remainingDonationRecordData,
      createdAt: postCreationDate
    }
  }

  toDto(dbFields: DonationRecordFields): DonationRecordDTO {
    const { PK, SK, createdAt, ...remainingDonationRecordFields } = dbFields
    return {
      ...remainingDonationRecordFields,
      id: SK.replace(`${DONATION_RECORD_PK_PREFIX}#`, ''),
      donorId: PK.replace(`${DONATION_RECORD_PK_PREFIX}#`, ''),
      createdAt
    }
  }
}
