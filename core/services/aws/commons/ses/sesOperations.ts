import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses'
import { GenericMessage } from '../../../../../commons/dto/MessageDTO'

const sesClient = new SESClient({ region: process.env.AWS_REGION })

interface SendWelcomeEmailParams {
  email: string;
  emailContent: GenericMessage;
}

export async function sendAppUserWellcomeMail({ email, emailContent }: SendWelcomeEmailParams): Promise<void> {
  const { title, content } = emailContent
  const senderEmail = process.env.EMAIL_SENDER ?? 'no-reply@bloodconnect.net'

  const emailParams: SendEmailCommandInput = {
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Body: {
        Html: {
          Data: content,
          Charset: 'UTF-8'
        }
      },
      Subject: {
        Data: title,
        Charset: 'UTF-8'
      }
    },
    Source: senderEmail
  }

  try {
    await sesClient.send(new SendEmailCommand(emailParams))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    throw new Error(`Failed to send welcome email: ${errorMessage}`)
  }
}