import { GenericMessage } from '@commons/dto/MessageDTO'
import MessageHandler from '../../technicalImpl/policies/MessageGenerator'

export default class ForgotPassword implements MessageHandler {
  constructor(
    private readonly userName: string,
    private readonly securityCode: string
  ) {}

  getMessage(): GenericMessage {
    return {
      title: 'Reset your password for Blood Connect',
      content: `Hello ${this.userName},<br/><br/>
                You have requested to reset your password.<br/>
                Use the following code to reset your password: ${this.securityCode}<br/><br/>
                If you did not request this, please ignore this email.<br/><br/>
                Thanks!`
    }
  }
}
