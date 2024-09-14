import { GenericMessage } from '@commons/dto/MessageDTO'
import MessageHandler from '../../technicalImpl/policies/MessageGenerator'

export default class EmailVerificationMessage implements MessageHandler {
  constructor(
    private readonly userName: string,
    private readonly securityCode: string
  ) {}

  getMessage(): GenericMessage {
    return {
      title: 'Welcome to Blood Connect!',
      content: `Hello ${this.userName},<br/><br/>
                Welcome! Please verify your email using the following code: ${this.securityCode}.<br/><br/>
                Thanks!`
    }
  }
}
