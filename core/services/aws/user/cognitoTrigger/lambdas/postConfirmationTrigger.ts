import type { PostConfirmationTriggerEvent } from 'aws-lambda'
import { UserService } from 'application/userWorkflow/UserService'
import type { UserDTO } from '../../../../../../commons/dto/UserDTO'
import DynamoDbTableOperations from '../../../commons/ddbOperations/DynamoDbTableOperations'
import type {
  UserFields
} from '../../../commons/ddbModels/UserModel';
import UserModel from '../../../commons/ddbModels/UserModel'
import { updateCognitoUserInfo } from '../../../commons/cognito/CognitoOperations'
import { sendAppUserWelcomeMail } from '../../../commons/ses/sesOperations'
import type { Logger } from 'application/models/logger/Logger';
import { JsonLogger } from '../../../../../../commons/libs/logger/JsonLogger';
import { Config } from '../../../../../../commons/libs/config/config';
import UserDynamoDbOperations from '../../../commons/ddbOperations/UserDynamoDbOperations';

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const userDynamoDbOperations = new UserDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function postConfirmationLambda(
  event: PostConfirmationTriggerEvent
): Promise<PostConfirmationTriggerEvent> {
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
    return event
  }
  const logger = JsonLogger.child({
    email: event.request.userAttributes.email,
    name: event.request.userAttributes.name
  }) as Logger

  const userService = new UserService(userDynamoDbOperations, logger)
  const userAttributes = {
    email: event.request.userAttributes.email,
    name: event.request.userAttributes.name ?? '',
    phoneNumbers: [event.request.userAttributes.phone_number ?? '']
  }

  logger.info('creating user')
  const dbResponse = await userService.createNewUser(
    userAttributes,
    new DynamoDbTableOperations<UserDTO, UserFields, UserModel>(new UserModel(), config.dynamodbTableName, config.awsRegion)
  )

  const cognitoAttributes = {
    'custom:userId': dbResponse.id.toString()
  }

  logger.info('updating cognito user')
  await updateCognitoUserInfo({
    userPoolId: event.userPoolId,
    username: event.userName,
    attributes: cognitoAttributes
  })

  logger.info('sending welcome email')
  const emailContent = userService.getAppUserWelcomeMail(userAttributes.name)
  await sendAppUserWelcomeMail({
    email: userAttributes.email,
    emailContent
  })

  return event
}

export default postConfirmationLambda
