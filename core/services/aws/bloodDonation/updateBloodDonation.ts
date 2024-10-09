import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import { DonationDTO } from '../../../../commons/dto/DonationDTO'
import { BloodDonationModel, DonationFields } from '../../../application/technicalImpl/dbModels/BloodDonationModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'

async function updateBloodDonationLambda(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const bloodDonationService = new BloodDonationService()
  const bloodDonationAttributes = {
    phone: '',
    bloodGroup: 'string',
    location: 'string',
    donationDate: ''
  }
  await bloodDonationService.updateBloodDonaiton(bloodDonationAttributes, new DynamoDbTableOperations<DonationDTO, DonationFields, BloodDonationModel>(new BloodDonationModel()))
  return generateApiGatewayResponse('Unauthorized', HTTP_CODES.UNAUTHORIZED)
}

export default updateBloodDonationLambda
