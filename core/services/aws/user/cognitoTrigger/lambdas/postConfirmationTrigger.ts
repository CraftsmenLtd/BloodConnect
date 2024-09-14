import { PostConfirmationTriggerEvent } from 'aws-lambda'
import { UserService } from '@application/userWorkflows/UserService'
import DynamoDbTableOperations from 'core/services/aws/commons/ddb/dao/DynamoDbTableOperations'
import { UserDTO } from '@commons/dto/UserDTO'
import DbModelDtoConverter from 'core/services/aws/commons/ddb/models/DbModelDtoConverter'
import UserDdbModel from 'core/services/aws/commons/ddb/models/UserModel'

async function postConfirmationLambda(event: PostConfirmationTriggerEvent): Promise<void> {
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
    return
  }

  const userService = new UserService()
  const userAttributes = {
    email: event.request.userAttributes.email,
    name: event.request.userAttributes.name ?? '',
    phone_number: event.request.userAttributes.phone_number ?? ''
  }
  await userService.createNewUser(userAttributes, new DynamoDbTableOperations<UserDTO, DbModelDtoConverter<UserDTO>>(new UserDdbModel()))
}

export default postConfirmationLambda
