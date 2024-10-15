import { DonationDTO } from '../../../../commons/dto/DonationDTO'
import { DbModelDtoAdapter, HasTimeLog, NosqlModel, IndexDefinitions, DbIndex, IndexType } from './DbModelDefinitions'

export type DonationFields = Omit<DonationDTO, 'id' | 'seekerId'> & HasTimeLog & {
  PK: `BLOOD_REQ#${string}`;
  SK: `BLOOD_REQ#${string}`;
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
      PK: `BLOOD_REQ#${seekerId}`,
      SK: `BLOOD_REQ#${id}`,
      ...remainingDonationData,
      createdAt: new Date().toISOString()
    }
  }

  toDto(dbFields: DonationFields): DonationDTO {
    const { PK, SK, createdAt, ...remainingDonationFields } = dbFields
    return { ...remainingDonationFields, id: SK.replace('BLOOD_REQ#', ''), seekerId: PK.replace('BLOOD_REQ#', '') }
  }
}
