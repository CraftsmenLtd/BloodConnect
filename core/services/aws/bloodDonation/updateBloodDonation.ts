import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import { UpdateBloodDonationAttributes } from '../../../application/bloodDonationWorkflow/Types'
import { DonationDTO } from '../../../../commons/dto/DonationDTO'
import { BloodDonationModel, DonationFields } from '../../../application/technicalImpl/dbModels/BloodDonationModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'

const allowedKeys: Array<keyof UpdateBloodDonationAttributes> = [
  'bloodQuantity',
  'urgencyLevel',
  'donationDateTime',
  'contactInfo',
  'patientCondition',
  'patientName',
  'transportationInfo',
  'shortDescription'
]

type RequiredAttributes = Pick<UpdateBloodDonationAttributes, 'requestPostId' | 'seekerId'>
type OptionalAttributes = Partial<Omit<UpdateBloodDonationAttributes, 'requestPostId' | 'seekerId'>>

const bloodDonationService = new BloodDonationService()

async function updateBloodDonationLambda(event: UpdateBloodDonationAttributes): Promise<APIGatewayProxyResult> {
  try {
    const bloodDonationAttributes: RequiredAttributes & OptionalAttributes = {
      requestPostId: event.requestPostId,
      seekerId: event.seekerId,
      ...Object.fromEntries(
        Object.entries(event)
          .filter(([key]) => allowedKeys.includes(key as keyof UpdateBloodDonationAttributes))
          .filter(([_, value]) => value !== undefined && value !== '')
      )
    }
    const response = await bloodDonationService.updateBloodDonation(bloodDonationAttributes, new DynamoDbTableOperations<DonationDTO, DonationFields, BloodDonationModel>(new BloodDonationModel()))
    return generateApiGatewayResponse(response, HTTP_CODES.OK)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return generateApiGatewayResponse(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  }
}

export default updateBloodDonationLambda
