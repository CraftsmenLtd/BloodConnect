import { APIGatewayProxyResult } from 'aws-lambda'
import { UserService } from '../../../application/userWorkflow/UserService'
import { LocationDTO, UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import UserModel, {
  UserFields
} from '../../../application/models/dbModels/UserModel'
import { UpdateUserAttributes } from '../../../application/userWorkflow/Types'
import LocationModel, {
  LocationFields
} from '../../../application/models/dbModels/LocationModel'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import {
  createHTTPLogger,
  HttpLoggerAttributes
} from '../commons/httpLogger/HttpLogger'

async function createUserLambda(
  event: UpdateUserAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const { userId, apiGwRequestId, cloudFrontRequestId } = event
  const httpLogger = createHTTPLogger(
    userId,
    apiGwRequestId,
    cloudFrontRequestId
  )
  try {
    const userService = new UserService()
    const userAttributes = {
      userId,
      ...Object.fromEntries(
        Object.entries(event).filter(
          ([_, value]) => value !== undefined && value !== ''
        )
      )
    }

    const response = await userService.updateUser(
      userAttributes as UpdateUserAttributes,
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(
        new UserModel()
      ),
      new DynamoDbTableOperations<LocationDTO, LocationFields, LocationModel>(
        new LocationModel()
      ),
      new LocationModel()
    )
    return generateApiGatewayResponse({ message: response, success: true }, HTTP_CODES.CREATED)
  } catch (error) {
    httpLogger.error(error)
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    return generateApiGatewayResponse(
      `Error: ${errorMessage}`,
      HTTP_CODES.ERROR
    )
  }
}

export default createUserLambda
