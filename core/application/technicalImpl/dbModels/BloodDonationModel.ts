import { DonationDTO } from '../../../../commons/dto/DonationDTO'
import { DbModelDtoAdapter, HasTimeLog, NosqlModel, IndexDefinitions, DbIndex, IndexType } from './DbModelDefinitions'

export type DonationFields = Omit<DonationDTO, 'id' | 'seekerId'> & HasTimeLog & {
  pk: `BLOOD_REQ#${string}`;
  sk: `BLOOD_REQ#${string}`;
}

export class BloodDonationModel implements NosqlModel<DonationFields>, DbModelDtoAdapter<DonationDTO, DonationFields> {
  getIndexDefinitions(): IndexDefinitions<DonationFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<DonationFields> {
    return { partitionKey: 'pk', sortKey: 'sk' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<DonationFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(donationDto: DonationDTO): DonationFields {
    const { seekerId, id, ...remainingDonationData } = donationDto
    return {
      pk: `BLOOD_REQ#${seekerId}`,
      sk: `BLOOD_REQ#${id}`,
      ...remainingDonationData,
      createdAt: new Date().toISOString()
    }
  }

  toDto(dbFields: DonationFields): DonationDTO {
    const { pk, sk, createdAt, ...remainingDonationFields } = dbFields
    return { ...remainingDonationFields, id: sk.replace('BLOOD_REQ#', ''), seekerId: pk.replace('BLOOD_REQ#', '') }
  }
}
