import type { APIGatewayProxyResult } from 'aws-lambda'
import { UserService } from '../../../application/userWorkflow/UserService'
import type { UpdateUserAttributes } from '../../../application/userWorkflow/Types'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger'
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import {
  UNKNOWN_ERROR_MESSAGE,
  UPDATE_PROFILE_SUCCESS
} from '../../../../commons/libs/constants/ApiResponseMessages'
import LocationDynamoDbOperations from '../commons/ddbOperations/LocationDynamoDbOperations'
import { Config } from '../../../../commons/libs/config/config'
import UserDynamoDbOperations from '../commons/ddbOperations/UserDynamoDbOperations'
import { LocationService } from '../../../application/userWorkflow/LocationService'

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

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const isValidIsoDate = (value: unknown): value is string =>
  typeof value === 'string'
  && ISO_DATE_PATTERN.test(value)
  && !Number.isNaN(Date.parse(value))

async function updateUserLambda(
  event: UpdateUserAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(event.userId, event.apiGwRequestId, event.cloudFrontRequestId)
  const userService = new UserService(userDynamoDbOperations, httpLogger)
  const locationService = new LocationService(locationDynamoDbOperations, httpLogger)

  try {
    const userAttributes: UpdateUserAttributes = {
      userId: event.userId,
      availableForDonation:
        `${event.availableForDonation}` === 'true' || event.availableForDonation === true
          ? true
          : false,
      ...(event.phoneNumbers !== undefined && { phoneNumbers: event.phoneNumbers }),
      ...(isValidIsoDate(event.dateOfBirth) && { dateOfBirth: event.dateOfBirth }),
      ...(event.gender !== undefined && { gender: event.gender }),
      ...(event.bloodGroup !== undefined && { bloodGroup: event.bloodGroup }),
      ...(event.preferredDonationLocations !== undefined && {
        preferredDonationLocations: event.preferredDonationLocations
      }),
      ...(event.height !== undefined && { height: event.height }),
      ...(event.weight !== undefined && { weight: event.weight }),
      ...(isValidIsoDate(event.lastDonationDate) && { lastDonationDate: event.lastDonationDate }),
      ...(isValidIsoDate(event.lastVaccinatedDate) && {
        lastVaccinatedDate: event.lastVaccinatedDate
      }),
      ...(event.NIDFront !== undefined && { NIDFront: event.NIDFront }),
      ...(event.NIDBack !== undefined && { NIDBack: event.NIDBack }),
      ...(event.profilePicture !== undefined && { profilePicture: event.profilePicture })
    }

    await userService.updateUserAttributes(
      event.userId,
      userAttributes,
      locationService,
      config.minMonthsBetweenDonations
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
