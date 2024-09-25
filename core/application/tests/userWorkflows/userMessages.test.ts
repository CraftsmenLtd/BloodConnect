import { getEmailVerificationMessage, getPasswordResetVerificationMessage } from '@application/userWorkflows/userMessages'
import { GenericMessage } from '@commons/dto/MessageDTO'
import { EMAIL_VERIFICATION_TITLE, getEmailVerificationContent, PASSWORD_RESET_TITLE, getPasswordResetContent } from '@application/utils/messageConstants'

describe('User Message Functions', () => {
  const userName = 'Ebrahim'
  const securityCode = '123456'

  test('should generate email verification message', () => {
    const expectedMessage: GenericMessage = {
      title: EMAIL_VERIFICATION_TITLE,
      content: getEmailVerificationContent(userName, securityCode)
    }

    const result = getEmailVerificationMessage(userName, securityCode)

    expect(result).toEqual(expectedMessage)
  })

  test('should generate password reset verification message', () => {
    const expectedMessage: GenericMessage = {
      title: PASSWORD_RESET_TITLE,
      content: getPasswordResetContent(userName, securityCode)
    }

    const result = getPasswordResetVerificationMessage(userName, securityCode)

    expect(result).toEqual(expectedMessage)
  })
})
