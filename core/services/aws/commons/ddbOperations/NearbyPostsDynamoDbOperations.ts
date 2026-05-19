import DynamoDbTableOperations from './DynamoDbTableOperations'
import type {
  QueryInput
} from '../../../../application/models/policies/repositories/QueryTypes'
import {
  QueryConditionOperator
} from '../../../../application/models/policies/repositories/QueryTypes'
import type { DonationDTO } from '../../../../../commons/dto/DonationDTO'
import type NearbyPostsRepository from 'core/application/models/policies/repositories/NearbyPostsRepository'
import type { NearbyPost } from 'core/application/models/policies/repositories/NearbyPostsRepository'
import type { DonationFields } from '../ddbModels/BloodDonationModel'
import { BloodDonationModel } from '../ddbModels/BloodDonationModel'

const PROJECTED_ATTRIBUTES = [
  'PK',
  'SK',
  'GSI1PK',
  'GSI1SK',
  'requestedBloodGroup',
  'bloodQuantity',
  'urgencyLevel',
  'latitude',
  'longitude',
  'location',
  'donationDateTime',
  'patientName',
  'seekerName',
  'contactNumber',
  'shortDescription',
  'transportationInfo',
  'createdAt'
]

export default class NearbyPostsDynamoDbOperations extends DynamoDbTableOperations<
  DonationDTO,
  DonationFields,
  BloodDonationModel
> implements NearbyPostsRepository {
  constructor(tableName: string, region: string) {
    super(new BloodDonationModel(), tableName, region)
  }

  async queryPostsInHex(
    countryCode: string,
    bloodGroup: string,
    h3Res5Cell: string,
    limit: number
  ): Promise<NearbyPost[]> {
    const gsiIndex = this.modelAdapter.getIndex('GSI', 'GSI1')
    if (gsiIndex === undefined) {
      throw new Error('Index not found.')
    }

    const query: QueryInput<DonationFields> = {
      partitionKeyCondition: {
        attributeName: gsiIndex.partitionKey,
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `REQ#${countryCode}#${bloodGroup}#PENDING#${h3Res5Cell}`
      },
      options: { limit }
    }

    const queryResult = await super.query(
      query as QueryInput<Record<string, unknown>>,
      'GSI1',
      PROJECTED_ATTRIBUTES
    )

    return (queryResult.items ?? []).map((item) => {
      const raw = item as unknown as Record<string, unknown>
      const pk = (raw.PK as string) ?? ''
      const sk = (raw.SK as string) ?? ''
      const seekerId = pk.replace('BLOOD_REQ#', '')
      const requestPostId = sk.split('#')[2] ?? ''

      return {
        requestPostId,
        seekerId,
        requestedBloodGroup: (raw.requestedBloodGroup as string) ?? '',
        bloodQuantity: (raw.bloodQuantity as number) ?? 0,
        urgencyLevel: (raw.urgencyLevel as string) ?? '',
        latitude: (raw.latitude as number) ?? 0,
        longitude: (raw.longitude as number) ?? 0,
        location: (raw.location as string) ?? '',
        donationDateTime: (raw.donationDateTime as string) ?? '',
        patientName: raw.patientName as string | undefined,
        seekerName: raw.seekerName as string | undefined,
        contactNumber: raw.contactNumber as string | undefined,
        shortDescription: raw.shortDescription as string | undefined,
        transportationInfo: raw.transportationInfo as string | undefined,
        createdAt: (raw.createdAt as string) ?? ''
      }
    })
  }
}
