import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { UserDTO } from '../../../../commons/dto/UserDTO'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import BloodDonationOperationError from '../../../application/bloodDonationWorkflow/BloodDonationOperationError'
import { createPlatformEndpoint, SnsRegistrationAttributes } from '../commons/sns/createPlatformEndpoint'
import { UserService } from '../../../application/userWorkflows/UserService'
import UserModel, { UserFields } from '../../../application/technicalImpl/dbModels/UserModel'

const userService = new UserService()

async function createBloodDonationLambda(event: SnsRegistrationAttributes): Promise<APIGatewayProxyResult> {
  try {
    const snsAttributes = {
      userId: event.userId,
      deviceToken: event.deviceToken,
      platform: event.platform
    }
    const response = await createPlatformEndpoint(snsAttributes)
    await userService.storeEndpointArn(
      { userId: snsAttributes.userId, endpointArn: response.endpointArn },
      new DynamoDbTableOperations<UserDTO, UserFields, UserModel>(new UserModel())
    )
    return generateApiGatewayResponse({ message: response }, HTTP_CODES.OK)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    const errorCode = error instanceof BloodDonationOperationError ? error.errorCode : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default createBloodDonationLambda
