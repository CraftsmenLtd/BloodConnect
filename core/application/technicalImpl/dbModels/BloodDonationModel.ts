import { DonationDTO } from '../../../../commons/dto/DonationDTO'
import { DbModelDtoAdapter, HasTimeLog, NosqlModel, IndexDefinitions, DbIndex, IndexType } from './DbModelDefinitions'

export type DonationFields = Omit<DonationDTO, 'id' | 'donationDateTime'> & HasTimeLog & {
  pk: `BLOOD_REQ#${string}`;
  sk: 'BLOOD_REQ';
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
    const { id, donationDateTime, ...remainingDonationData } = donationDto
    return {
      pk: `BLOOD_REQ#${typeof id === 'string' ? id : id.toString()}`,
      sk: 'BLOOD_REQ',
      ...remainingDonationData,
      createdAt: donationDateTime.toISOString()
    }
  }

  toDto(dbFields: DonationFields): DonationDTO {
    const { pk, sk, createdAt, ...remainingDonationFields } = dbFields
    return { ...remainingDonationFields, id: pk.replace('BLOOD_REQ#', ''), donationDateTime: new Date(createdAt) }
  }
}
