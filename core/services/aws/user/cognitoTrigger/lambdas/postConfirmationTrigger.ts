import { APIGatewayProxyResult, PostConfirmationTriggerEvent } from 'aws-lambda'
import { UserService } from '@application/userWorkflows/UserService'
import { UserDTO } from '@commons/dto/UserDTO'
import DynamoDbTableOperations from '../../../commons/ddb/DynamoDbTableOperations'
import UserModel, { UserFields } from '@application/technicalImpl/dbModels/UserModel'
import generateApiGatewayResponse from 'core/services/aws/commons/lambda/ApiGateway'
import { HttpCodes } from '@commons/libs/constants/GenericCodes'

async function postConfirmationLambda(event: PostConfirmationTriggerEvent): Promise<APIGatewayProxyResult | undefined> {
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
    return
  }

  const userService = new UserService()
  const userAttributes = {
    email: event.request.userAttributes.email,
    name: event.request.userAttributes.name ?? '',
    phone_number: event.request.userAttributes.phone_number ?? ''
  }
  const response = await userService.createNewUser(userAttributes, new DynamoDbTableOperations<UserDTO, UserFields, UserModel>(new UserModel()))
  return generateApiGatewayResponse(response, HttpCodes.created)
}

export default postConfirmationLambda
