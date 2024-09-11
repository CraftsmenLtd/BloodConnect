import { CustomMessageTriggerEvent, Context, Callback } from 'aws-lambda'

function customEmailTemplateLambda(
  event: CustomMessageTriggerEvent,
  _: Context,
  callback: Callback<CustomMessageTriggerEvent>
): void {
  if (event.triggerSource === 'CustomMessage_SignUp') {
    event.response.emailSubject = 'Welcome to Blood Connect!'
    event.response.emailMessage = `Hello ${event.request.userAttributes.name},<br/><br/>
                                      Welcome! Please verify your email using the following code: ${event.request.codeParameter}.<br/><br/>
                                      Thanks!`
  } else if (event.triggerSource === 'CustomMessage_ForgotPassword') {
    event.response.emailSubject = 'Reset your password for Blood Connect'
    event.response.emailMessage = `Hello ${event.request.userAttributes.name},<br/><br/>
                                   You have requested to reset your password.<br/>
                                   Use the following code to reset your password: ${event.request.codeParameter}<br/><br/>
                                   If you did not request this, please ignore this email.<br/><br/>
                                   Thanks!`
  }
  callback(null, event)
}

export default customEmailTemplateLambda
