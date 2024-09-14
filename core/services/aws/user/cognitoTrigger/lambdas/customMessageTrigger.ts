import { UserService } from '@application/userWorkflows/UserService'
import { CustomMessageTriggerEvent } from 'aws-lambda'

function customEmailTemplateLambda(event: CustomMessageTriggerEvent): { emailSubject: string; emailMessage: string } | undefined {
  const userService = new UserService()
  const { userAttributes: { name }, codeParameter } = event.request
  switch (event.triggerSource) {
    case 'CustomMessage_SignUp': {
      const { title, message } = userService.getPostSignUpMessage(name, codeParameter)
      return { emailSubject: title, emailMessage: message }
    }
    case 'CustomMessage_ForgotPassword':{
      const { title, message } = userService.getForgotPasswordMessage(name, codeParameter)
      return { emailSubject: title, emailMessage: message }
    }
  }
}

export default customEmailTemplateLambda
