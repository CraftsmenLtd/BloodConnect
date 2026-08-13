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
      // Spread conditionally like every other field: an omitted flag must keep the
      // profile's current value (via the merge in updateUserAttributes), not force
      // the donor to unavailable. The VTL delivers booleans as strings, hence the
      // string comparison.
      ...(event.availableForDonation !== undefined && {
        availableForDonation:
          `${event.availableForDonation}` === 'true' || event.availableForDonation === true
      }),
      // Geo-derived from the CloudFront viewer-country header; empty when the
      // header is absent. Only forwarded when present — the service uses it
      // solely to fill profiles that never received a countryCode at signup.
      ...(typeof event.countryCode === 'string' && event.countryCode !== '' && {
        countryCode: event.countryCode
      }),
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
      // Provenance is derived in UserService by comparing against the stored picture.
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
