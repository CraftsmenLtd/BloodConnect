import { APIGatewayProxyResult } from 'aws-lambda'
import { UserService } from '../../../application/userWorkflows/UserService'
import { LocationDTO, UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import UserModel, { UserFields } from '../../../application/technicalImpl/dbModels/UserModel'
import { UpdateUserAttributes } from '../../../application/userWorkflows/Types'
import LocationModel, { LocationFields } from '../../../application/technicalImpl/dbModels/LocationModel'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'

async function updateUserLambda(event: UpdateUserAttributes): Promise<APIGatewayProxyResult> {
  try {
    const userService = new UserService()
    const userAttributes = {
      userId: event.userId,
      ...Object.fromEntries(
        Object.entries(event).filter(([_, value]) => value !== undefined && value !== '')
      )
    }

    const response = await userService.updateUser(
      userAttributes as UpdateUserAttributes,
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel()),
      new DynamoDbTableOperations<LocationDTO, LocationFields, LocationModel>(new LocationModel()),
      new LocationModel()
    )
    return generateApiGatewayResponse({ message: response }, HTTP_CODES.OK)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return generateApiGatewayResponse(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  }
}

export default updateUserLambda
