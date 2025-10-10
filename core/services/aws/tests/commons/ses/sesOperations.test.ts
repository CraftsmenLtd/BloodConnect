import type { SendEmailCommandInput } from '@aws-sdk/client-ses'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { mockClient } from 'aws-sdk-client-mock'
import { sendAppUserWelcomeMail } from '../../../commons/ses/sesOperations'
import type { GenericMessage } from '../../../../../../commons/dto/MessageDTO'
import { isNullOrUndefined } from '../../../../../../commons/libs/nullOrUndefined'

const sesClientMock = mockClient(SESClient)

const assertEmailParams = (params: SendEmailCommandInput, expectedParams: Partial<SendEmailCommandInput>): void => {
  expect(params).toBeDefined()
  expect(params.Message).toBeDefined()
  expect(params.Message?.Subject).toBeDefined()
  expect(params.Message?.Body).toBeDefined()
  expect(params.Message?.Body?.Html).toBeDefined()
  expect(params.Destination).toBeDefined()
  expect(params.Destination?.ToAddresses).toBeDefined()

  if (
    params.Message?.Subject?.Data !== undefined
    && params.Message?.Body?.Html?.Data !== undefined
    && params.Destination?.ToAddresses !== undefined
  ) {
    if (!isNullOrUndefined(expectedParams.Message?.Subject?.Data)) {
      expect(params.Message.Subject.Data).toBe(expectedParams.Message.Subject.Data)
    }
    if (!isNullOrUndefined(expectedParams.Message?.Body?.Html?.Data)) {
      expect(params.Message.Body.Html.Data).toEqual(expectedParams.Message.Body.Html.Data)
    }
    if (!isNullOrUndefined(expectedParams.Destination?.ToAddresses)) {
      expect(params.Destination.ToAddresses).toEqual(expectedParams.Destination.ToAddresses)
    }
    if (!isNullOrUndefined(expectedParams.Source) && isNullOrUndefined(params.Source)) {
      expect(params.Source).toBe(expectedParams.Source)
    }
  }
}

describe('SES Operations Tests', () => {
  const mockEmail = 'test@example.com'
  const mockEmailContent: GenericMessage = {
    title: 'Welcome to BloodConnect',
    content: '<p>Welcome to our platform!</p>'
  }
  const originalEnv = process.env

  beforeEach(() => {
    sesClientMock.reset()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('sendAppUserWelcomeMail', () => {
    test('should send email successfully with custom sender from environment variable', async() => {
      const customSender = 'custom@bloodconnect.net'
      process.env.EMAIL_SENDER = customSender
      sesClientMock.on(SendEmailCommand).resolves({})

      await sendAppUserWelcomeMail({ email: mockEmail, emailContent: mockEmailContent })
      const sendEmailCommand = sesClientMock.calls()[0].args[0] as SendEmailCommand
      assertEmailParams(sendEmailCommand.input, {
        Source: customSender,
        Destination: {
          ToAddresses: [mockEmail]
        },
        Message: {
          Subject: {
            Data: mockEmailContent.title,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: mockEmailContent.content,
              Charset: 'UTF-8'
            }
          }
        }
      })
    })

    test('should handle email content with all optional fields', async() => {
      const fullEmailContent: GenericMessage = {
        title: 'Welcome',
        subtitle: 'Optional subtitle',
        content: '<p>Full content</p>'
      }
      sesClientMock.on(SendEmailCommand).resolves({})

      await sendAppUserWelcomeMail({ email: mockEmail, emailContent: fullEmailContent })
      const sendEmailCommand = sesClientMock.calls()[0].args[0] as SendEmailCommand
      assertEmailParams(sendEmailCommand.input, {
        Message: {
          Subject: {
            Data: 'Welcome',
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: '<p>Full content</p>',
              Charset: 'UTF-8'
            }
          }
        }
      })
    })

    test('should throw error when SES send fails with Error instance', async() => {
      const mockError = new Error('SES service error')
      sesClientMock.on(SendEmailCommand).rejects(mockError)

      await expect(
        sendAppUserWelcomeMail({ email: mockEmail, emailContent: mockEmailContent })
      ).rejects.toThrow('Failed to send welcome email: SES service error')
    })

    test('should throw error when SES send fails with unknown error type', async() => {
      const unknownError = 'Unknown error'
      sesClientMock.on(SendEmailCommand).rejects(unknownError)

      await expect(
        sendAppUserWelcomeMail({ email: mockEmail, emailContent: mockEmailContent })
      ).rejects.toThrow(`Failed to send welcome email: ${unknownError}`)
    })
  })
})
