import { DonationDTO } from '../../../../commons/dto/DonationDTO'
import { DbModelDtoAdapter, HasTimeLog, NosqlModel, IndexDefinitions, DbIndex, IndexType } from './DbModelDefinitions'

export type DonationFields = Omit<DonationDTO, 'id' | 'donationDate'> & HasTimeLog & {
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

  fromDto(userDto: DonationDTO): DonationFields {
    const { id, donationDate, ...remainingDonationData } = userDto
    return {
      pk: `BLOOD_REQ#${typeof id === 'string' ? id : id.toString()}`,
      sk: 'BLOOD_REQ',
      ...remainingDonationData,
      createdAt: donationDate.toISOString()
    }
  }

  toDto(dbFields: DonationFields): DonationDTO {
    const { pk, sk, createdAt, ...remainingUserFields } = dbFields
    return { ...remainingUserFields, id: pk.replace('USER#', ''), donationDate: new Date(createdAt) }
  }
}
