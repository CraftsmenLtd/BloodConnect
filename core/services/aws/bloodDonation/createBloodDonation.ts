import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import { DonationDTO } from '../../../../commons/dto/DonationDTO'
import { BloodDonationModel, DonationFields } from '../../../application/technicalImpl/dbModels/BloodDonationModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'

async function createBloodDonationLambda(event: DonationDTO): Promise<APIGatewayProxyResult> {
  const bloodDonationService = new BloodDonationService()
  console.log("event ---- ", event)
  const bloodDonationAttributes = {
    seekerId: event.seekerId,
    bloodGroup: event.bloodGroup,
    location: event.location,
    donationDateTime: event.donationDateTime
  }
  await bloodDonationService.createBloodDonation(bloodDonationAttributes, new DynamoDbTableOperations<DonationDTO, DonationFields, BloodDonationModel>(new BloodDonationModel()))
  return generateApiGatewayResponse('Unauthorized', HTTP_CODES.UNAUTHORIZED)
}

export default createBloodDonationLambda
