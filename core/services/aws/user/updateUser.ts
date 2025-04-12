import type { APIGatewayProxyResult } from 'aws-lambda'
import { UserService } from '../../../application/userWorkflow/UserService'
import type { UpdateUserAttributes } from '../../../application/userWorkflow/Types'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger';
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE, UPDATE_PROFILE_SUCCESS } from '../../../../commons/libs/constants/ApiResponseMessages'
import LocationDynamoDbOperations from '../commons/ddbOperations/LocationDynamoDbOperations'
import { Config } from '../../../../commons/libs/config/config';
import UserDynamoDbOperations from '../commons/ddbOperations/UserDynamoDbOperations';
import { LocationService } from '../../../application/userWorkflow/LocationService';

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
  minMonthsBetweenDonations: number;
}>().getConfig()

const userDynamoDbOperations = new UserDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const locationDynamoDbOperations = new LocationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)


async function updateUserLambda(
  event: UpdateUserAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(event.userId, event.apiGwRequestId, event.cloudFrontRequestId)
  const userService = new UserService(userDynamoDbOperations, httpLogger)
  const locationService = new LocationService(locationDynamoDbOperations, httpLogger)

  try {
    const userAttributes: UpdateUserAttributes = {
      userId: event.userId,
      email: event.email,
      name: event.name,
      phoneNumbers: event.phoneNumbers,
      bloodGroup: event.bloodGroup,
      height: event.height,
      weight: event.weight,
      gender: event.gender,
      dateOfBirth: event.dateOfBirth,
      age: event.age,
      preferredDonationLocations: event.preferredDonationLocations,
      lastDonationDate: event.lastDonationDate,
      NIDFront: event.NIDFront,
      lastVaccinatedDate: event.lastVaccinatedDate,
      NIDBack: event.NIDBack,
      availableForDonation: `${event.availableForDonation}` === 'true' ? true : event.availableForDonation
    }

    await userService.updateUser(userAttributes, locationService, config.minMonthsBetweenDonations)

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
