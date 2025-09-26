import type { PostAuthenticationTriggerEvent } from 'aws-lambda'
import { UserService } from '../../../../../application/userWorkflow/UserService'
import type { Logger } from '../../../../../application/models/logger/Logger'
import { JsonLogger } from '../../../../../../commons/libs/logger/JsonLogger'
import { Config } from '../../../../../../commons/libs/config/config'
import UserDynamoDbOperations from '../../../commons/ddbOperations/UserDynamoDbOperations'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const userDynamoDbOperations = new UserDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function postAuthenticationLambda(
  event: PostAuthenticationTriggerEvent
): Promise<PostAuthenticationTriggerEvent> {
  if (event.triggerSource !== 'PostAuthentication_Authentication') {
    return event
  }

  const logger = JsonLogger.child({
    email: event.request.userAttributes.email,
    name: event.request.userAttributes.name
  }) as Logger

  const userId = event.request.userAttributes?.['custom:userId']
  if (!userId) {
    logger.warn('postAuthenticationTrigger: custom:userId missing; skipping lastLogin update')
    return event
  }

  const userService = new UserService(userDynamoDbOperations, logger)

  logger.info('attempting to update last successful login timestamp')
  const timestamp = new Date().toISOString()
  await userService.recordLastSuccessfulLoginTimestamp(userId, timestamp)

  return event
}

export default postAuthenticationLambda
