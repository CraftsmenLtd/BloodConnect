import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import DonationStatusManagerError from './DonationStatusManagerError'
import { DonationStatusManagerAttributes } from './Types'
import Repository from '../technicalImpl/policies/repositories/Repository'
import { DonationStatusManagerQueryResultDTO, DonationStatus } from '../../../commons/dto/DonationDTO'
import { QueryConditionOperator } from '../technicalImpl/policies/repositories/QueryTypes'

export class DonationStatusManagerService {
  async checkDonorNumber(
    donationStatusManagerAttributes: DonationStatusManagerAttributes,
    acceptStatusManagerRepository: Repository<DonationStatusManagerQueryResultDTO>
  ): Promise<string> {
    try {
      const { seekerId, requestPostId, createdAt } = donationStatusManagerAttributes

      const queryResult = await acceptStatusManagerRepository.query({
        partitionKeyCondition: {
          attributeName: 'PK',
          attributeValue: `BLOOD_REQ#${seekerId}`,
          operator: QueryConditionOperator.EQUALS
        }
      })

      const items = queryResult.items ?? []

      const bloodReqItem = items.find((item: DonationStatusManagerQueryResultDTO) =>
        item.SK === `BLOOD_REQ#${createdAt}#${requestPostId}`
      )
      const acceptedItems = items.filter((item: DonationStatusManagerQueryResultDTO) =>
        item.SK.startsWith(`ACCEPTED#${requestPostId}`)
      )

      if (bloodReqItem === null || bloodReqItem === undefined) {
        throw new Error('Donation request not found.')
      }

      if (bloodReqItem?.status === DonationStatus.COMPLETED) {
        throw new Error('You can\'t update a completed request')
      }

      const acceptedCount = acceptedItems.length

      if (acceptedCount >= bloodReqItem.bloodQuantity) {
        await acceptStatusManagerRepository.update({
          PK: bloodReqItem.PK,
          SK: bloodReqItem.SK,
          updateExpression: 'set #status = :status',
          expressionAttributeNames: { '#status': 'status' },
          expressionAttributeValues: { ':status': DonationStatus.COMPLETED }
        })

        return 'Donation request is complete.'
      }

      return 'More donors are needed to fulfill the blood quantity.'
    } catch (error) {
      throw new DonationStatusManagerError(
        `Failed to check donor numbers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        GENERIC_CODES.ERROR
      )
    }
  }
}
