import { UserService } from '../../../../../application/userWorkflow/UserService'
import type { GenericMessage } from '../../../../../../commons/dto/MessageDTO'
import type { Callback, Context, CustomMessageTriggerEvent } from 'aws-lambda'
import UserDynamoDbOperations from '../../../commons/ddbOperations/UserDynamoDbOperations';
import { JsonLogger } from '../../../../../../commons/libs/logger/JsonLogger';
import type { Logger } from '../../../../../application/models/logger/Logger';
import { Config } from '../../../../../../commons/libs/config/config';

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const userDynamoDbOperations = new UserDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

function customEmailTemplateLambda(
  event: CustomMessageTriggerEvent,
  _: Context,
  callback: Callback<CustomMessageTriggerEvent>
): void {
  const {
    userAttributes: { name },
    codeParameter
  } = event.request
  const logger = JsonLogger.child({
    name: event.request.userAttributes.name
  }) as Logger
  const userService = new UserService(userDynamoDbOperations, logger)

  let emailContent: GenericMessage
  switch (event.triggerSource) {
  case 'CustomMessage_SignUp':
    emailContent = userService.getPostSignUpMessage(name, codeParameter)
    break
  case 'CustomMessage_ForgotPassword':
    emailContent = userService.getForgotPasswordMessage(name, codeParameter)
    break
  default:
    callback(null, event)
    return
  }
  const { title, content } = emailContent
  event.response.emailSubject = title
  event.response.emailMessage = content
  callback(null, event)
}

export default customEmailTemplateLambda
