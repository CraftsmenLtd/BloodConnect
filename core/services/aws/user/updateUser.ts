import { APIGatewayProxyResult } from 'aws-lambda'
import { UserService } from '../../../application/userWorkflow/UserService'
import { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import UserModel, { UserFields } from '../../../application/models/dbModels/UserModel'
import { UpdateUserAttributes } from '../../../application/userWorkflow/Types'
import LocationModel from '../../../application/models/dbModels/LocationModel'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { createHTTPLogger, HttpLoggerAttributes } from '../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE, UPDATE_PROFILE_SUCCESS } from '../../../../commons/libs/constants/ApiResponseMessages'
import LocationDynamoDbOperations from '../commons/ddb/LocationDynamoDbOperations'

async function updateUserLambda(
  event: UpdateUserAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(event.userId, event.apiGwRequestId, event.cloudFrontRequestId)
  try {
    const userService = new UserService()
    const userAttributes = {
      userId: event.userId,
      ...Object.fromEntries(
        Object.entries(event).filter(([_, value]) => value !== undefined && value !== '')
      )
    }

    await userService.updateUser(
      userAttributes as UpdateUserAttributes,
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel()),
      new LocationDynamoDbOperations(new LocationModel())
    )
    return generateApiGatewayResponse(
      { message: UPDATE_PROFILE_SUCCESS, success: true },
      HTTP_CODES.OK
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    return generateApiGatewayResponse(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  }
}

export default updateUserLambda
