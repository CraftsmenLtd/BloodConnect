import type { APIGatewayProxyResult } from 'aws-lambda'
import { UserService } from '../../../application/userWorkflow/UserService'
import type { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import type { UserFields } from '../../../application/models/dbModels/UserModel';
import UserModel from '../../../application/models/dbModels/UserModel'
import type { CreateUserAttributes } from '../../../application/userWorkflow/Types'
import LocationModel from '../../../application/models/dbModels/LocationModel'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger';
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { CREATE_PROFILE_SUCCESS, UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import LocationDynamoDbOperations from '../commons/ddb/LocationDynamoDbOperations'
import { Config } from '../../../../commons/libs/config/config';
import type { Logger } from '../../../application/models/logger/Logger';

type ExpectedConfig = {
  dynamodbTableName: string;
  awsRegion: string;
  minMonthsBetweenDonations: number;
}

async function createUser(
  event: CreateUserAttributes,
  httpLogger: Logger,
  config: ExpectedConfig
): Promise<APIGatewayProxyResult> {
  try {
    const userService = new UserService()
    const userAttributes = {
      userId: event.userId,
      ...Object.fromEntries(
        Object.entries(event).filter(([_, value]) => value !== undefined && value !== '')
      ),
      availableForDonation: `${event.availableForDonation}` === 'true' ? true : event.availableForDonation
    }

    await userService.updateUser(
      userAttributes as CreateUserAttributes,
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel(), config.dynamodbTableName, config.awsRegion),
      new LocationDynamoDbOperations(new LocationModel(), config.dynamodbTableName, config.awsRegion),
      config.minMonthsBetweenDonations,
      httpLogger
    )
    return generateApiGatewayResponse(
      { message: CREATE_PROFILE_SUCCESS, success: true },
      HTTP_CODES.CREATED
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    return generateApiGatewayResponse(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  }
}

const config = new Config<ExpectedConfig>().getConfig()

export default async function createUserLambda(
  event: CreateUserAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.userId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  return createUser(event, httpLogger, config)
}
