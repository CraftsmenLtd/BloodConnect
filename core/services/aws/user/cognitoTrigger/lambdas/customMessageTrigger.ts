import { UserService } from '../../../../../application/userWorkflows/UserService'
import { GenericMessage } from '../../../../../../commons/dto/MessageDTO'
import { Callback, Context, CustomMessageTriggerEvent } from 'aws-lambda'

function customEmailTemplateLambda(event: CustomMessageTriggerEvent, _: Context,
  callback: Callback<CustomMessageTriggerEvent>): void {
  const userService = new UserService()
  const { userAttributes: { name }, codeParameter } = event.request
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
