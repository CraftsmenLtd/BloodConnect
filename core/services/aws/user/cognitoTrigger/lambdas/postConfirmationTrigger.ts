import { PostConfirmationTriggerEvent } from 'aws-lambda'
import { UserService } from '@application/userWorkflows/UserService'
import { UserDTO } from '@commons/dto/UserDTO'
import DynamoDbTableOperations from '../../../commons/ddb/DynamoDbTableOperations'
import UserModel, { UserFields } from '@application/technicalImpl/dbModels/UserModel'

async function postConfirmationLambda(event: PostConfirmationTriggerEvent): Promise<PostConfirmationTriggerEvent> {
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
    return event
  }

  const userService = new UserService()
  const userAttributes = {
    email: event.request.userAttributes.email,
    name: event.request.userAttributes.name ?? '',
    phone_number: event.request.userAttributes.phone_number ?? ''
  }
  await userService.createNewUser(userAttributes, new DynamoDbTableOperations<UserDTO, UserFields, UserModel>(new UserModel()))
  return event
}

export default postConfirmationLambda
