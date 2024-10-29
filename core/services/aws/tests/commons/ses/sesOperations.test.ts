import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses'
import { mockClient } from 'aws-sdk-client-mock'
import { sendAppUserWellcomeMail } from '../../../commons/ses/sesOperations'
import { GenericMessage } from '../../../../../../commons/dto/MessageDTO'

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
    params.Message?.Subject?.Data !== undefined &&
    params.Message?.Body?.Html?.Data !== undefined &&
    params.Destination?.ToAddresses !== undefined
  ) {
    if ((expectedParams.Message?.Subject?.Data) != null) {
      expect(params.Message.Subject.Data).toBe(expectedParams.Message.Subject.Data)
    }
    if ((expectedParams.Message?.Body?.Html?.Data) != null) {
      expect(params.Message.Body.Html.Data).toEqual(expectedParams.Message.Body.Html.Data)
    }
    if ((expectedParams.Destination?.ToAddresses) != null) {
      expect(params.Destination.ToAddresses).toEqual(expectedParams.Destination.ToAddresses)
    }
    if (expectedParams.Source != null) {
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

  describe('sendAppUserWellcomeMail', () => {
    test('should send email successfully with default sender', async() => {
      delete process.env.EMAIL_SENDER
      sesClientMock.on(SendEmailCommand).resolves({})

      await sendAppUserWellcomeMail({ email: mockEmail, emailContent: mockEmailContent })
      expect(sesClientMock.calls()).toHaveLength(1)
      const sendEmailCommand = sesClientMock.calls()[0].args[0] as SendEmailCommand

      assertEmailParams(sendEmailCommand.input, {
        Destination: {
          ToAddresses: [mockEmail]
        },
        Message: {
          Body: {
            Html: {
              Data: mockEmailContent.content,
              Charset: 'UTF-8'
            }
          },
          Subject: {
            Data: mockEmailContent.title,
            Charset: 'UTF-8'
          }
        },
        Source: 'no-reply@bloodconnect.net'
      })
    })

    test('should send email successfully with custom sender from environment variable', async() => {
      const customSender = 'custom@bloodconnect.net'
      process.env.EMAIL_SENDER = customSender
      sesClientMock.on(SendEmailCommand).resolves({})

      await sendAppUserWellcomeMail({ email: mockEmail, emailContent: mockEmailContent })
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

      await sendAppUserWellcomeMail({ email: mockEmail, emailContent: fullEmailContent })
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
        sendAppUserWellcomeMail({ email: mockEmail, emailContent: mockEmailContent })
      ).rejects.toThrow('Failed to send welcome email: SES service error')
    })

    test('should throw error when SES send fails with unknown error type', async() => {
      const unknownError = 'Unknown error'
      sesClientMock.on(SendEmailCommand).rejects(unknownError)

      await expect(
        sendAppUserWellcomeMail({ email: mockEmail, emailContent: mockEmailContent })
      ).rejects.toThrow(`Failed to send welcome email: ${unknownError}`)
    })
  })
})
