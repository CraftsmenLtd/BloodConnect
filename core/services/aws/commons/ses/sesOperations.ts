import type { SendEmailCommandInput } from '@aws-sdk/client-ses';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import type { GenericMessage } from '../../../../../commons/dto/MessageDTO'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../../commons/libs/constants/ApiResponseMessages'

const sesClient = new SESClient({ region: process.env.AWS_REGION })

interface SendWelcomeEmailParams {
  email: string;
  emailContent: GenericMessage;
}

export async function sendAppUserWelcomeMail ({ email, emailContent }: SendWelcomeEmailParams): Promise<void> {
  const { title, content } = emailContent
  const senderEmail = process.env.EMAIL_SENDER

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
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    throw new Error(`Failed to send welcome email: ${errorMessage}`)
  }
}
