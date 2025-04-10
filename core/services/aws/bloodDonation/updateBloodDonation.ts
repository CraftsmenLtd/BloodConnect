import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import type { UpdateBloodDonationAttributes } from '../../../application/bloodDonationWorkflow/Types'
import type { DonationDTO } from '../../../../commons/dto/DonationDTO'
import type { BloodDonationNotificationDTO } from '../../../../commons/dto/NotificationDTO'
import type {
  DonationFields
} from '../../../application/models/dbModels/BloodDonationModel';
import {
  BloodDonationModel
} from '../../../application/models/dbModels/BloodDonationModel'
import BloodDonationDynamoDbOperations from '../commons/ddb/BloodDonationDynamoDbOperations'
import NotificationDynamoDbOperations from '../commons/ddb/NotificationDynamoDbOperations'
import type {
  BloodDonationNotificationFields
} from '../../..//application/models/dbModels/DonationNotificationModel';
import DonationNotificationModel from '../../..//application/models/dbModels/DonationNotificationModel'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger';
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE, UPDATE_DONATION_REQUEST_SUCCESS } from '../../../../commons/libs/constants/ApiResponseMessages'
import type { Logger } from '../../../application/models/logger/Logger'
import { Config } from '../../../../commons/libs/config/config'

const allowedKeys: Array<keyof UpdateBloodDonationAttributes> = [
  'bloodQuantity',
  'urgencyLevel',
  'donationDateTime',
  'contactNumber',
  'patientName',
  'transportationInfo',
  'shortDescription',
  'createdAt'
]

type RequiredAttributes = Pick<
UpdateBloodDonationAttributes,
'requestPostId' | 'seekerId' | 'createdAt'
>
type OptionalAttributes = Partial<Omit<UpdateBloodDonationAttributes, 'requestPostId' | 'seekerId'>>

const bloodDonationService = new BloodDonationService()
const notificationService = new NotificationService()

type ExpectedConfig = {
  dynamodbTableName: string;
  awsRegion: string;
}

async function updateBloodDonation(
  event: UpdateBloodDonationAttributes,
  httpLogger: Logger,
  config: ExpectedConfig
): Promise<APIGatewayProxyResult> {
  try {
    const bloodDonationAttributes: RequiredAttributes & OptionalAttributes = {
      requestPostId: event.requestPostId,
      seekerId: event.seekerId,
      createdAt: event.createdAt,
      ...Object.fromEntries(
        Object.entries(event)
          .filter(([key]) => allowedKeys.includes(key as keyof UpdateBloodDonationAttributes))
          .filter(([_, value]) => value !== undefined && value !== '')
      )
    }
    const response = await bloodDonationService.updateBloodDonation(
      bloodDonationAttributes,
      new BloodDonationDynamoDbOperations<DonationDTO, DonationFields, BloodDonationModel>(
        new BloodDonationModel(), config.dynamodbTableName, config.awsRegion
      ),
      notificationService,
      new NotificationDynamoDbOperations<
      BloodDonationNotificationDTO,
      BloodDonationNotificationFields,
      DonationNotificationModel
        >(new DonationNotificationModel(), config.dynamodbTableName, config.awsRegion),
      httpLogger
    )
    return generateApiGatewayResponse(
      {
        success: true,
        message: UPDATE_DONATION_REQUEST_SUCCESS,
        data: response
      },
      HTTP_CODES.OK
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    return generateApiGatewayResponse(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  }
}

const config = new Config<ExpectedConfig>().getConfig()

export default async function updateBloodDonationLambda(
  event: UpdateBloodDonationAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.seekerId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  return updateBloodDonation(event, httpLogger, config)
}
