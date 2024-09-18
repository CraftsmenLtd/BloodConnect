import { getEmailVerificationMessage, getPasswordResetVerificationMessage } from '@application/userWorkflows/userMessages'
import { GenericMessage } from '@commons/dto/MessageDTO'

describe('User Message Functions', () => {
  const userName = 'Ebrahim'
  const securityCode = '123456'

  test('should generate email verification message', () => {
    const expectedMessage: GenericMessage = {
      title: 'Welcome to Blood Connect!',
      content: `Hello ${userName},<br/><br/>
              Welcome! Please verify your email using the following code: ${securityCode}.<br/><br/>
              Thanks!`
    }

    const result = getEmailVerificationMessage(userName, securityCode)

    expect(result).toEqual(expectedMessage)
  })

  test('should generate password reset verification message', () => {
    const expectedMessage: GenericMessage = {
      title: 'Reset your password for Blood Connect',
      content: `Hello ${userName},<br/><br/>
              You have requested to reset your password.<br/>
              Use the following code to reset your password: ${securityCode}<br/><br/>
              If you did not request this, please ignore this email.<br/><br/>
              Thanks!`
    }

    const result = getPasswordResetVerificationMessage(userName, securityCode)

    expect(result).toEqual(expectedMessage)
  })
})
