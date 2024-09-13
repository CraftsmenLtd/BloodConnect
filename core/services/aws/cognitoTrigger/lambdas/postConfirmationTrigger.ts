import { PostConfirmationTriggerEvent, Callback, Context } from 'aws-lambda'
import { UserService, UserAttributes } from '@application/userWorkflows/UserService'

const userService = new UserService()

function postConfirmationLambda(
  event: PostConfirmationTriggerEvent,
  _: Context,
  callback: Callback<PostConfirmationTriggerEvent>
): void {
  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    const userAttributes: UserAttributes = {
      email: event.request.userAttributes.email ?? '',
      name: event.request.userAttributes.name ?? '',
      phone_number: event.request.userAttributes.phone_number ?? ''
    }
    userService.createNewUser(userAttributes)
      .then(() => {
        callback(null, event)
      })
      .catch((error) => {
        callback(error)
      })
  } else {
    callback(null, event)
  }
}

export default postConfirmationLambda
