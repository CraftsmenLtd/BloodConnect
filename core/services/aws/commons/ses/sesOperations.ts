import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses'
import { GenericMessage } from '../../../../../commons/dto/MessageDTO'

const sesClient = new SESClient({ region: process.env.AWS_REGION })

interface SendWelcomeEmailParams {
  email: string;
  emailContent: GenericMessage;
}

// export class EmailError extends Error {
//   constructor(message: string) {
//     super(message)
//     this.name = 'EmailError'
//   }
// }

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
    // eslint-disable-next-line no-console
    console.log(`Attempting to send welcome email to ${email} from ${senderEmail}`)
    await sesClient.send(new SendEmailCommand(emailParams))
    // eslint-disable-next-line no-console
    console.log(`App User welcome email sent successfully to ${email}`)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('SES Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    throw new Error(`Failed to send welcome email: ${errorMessage}`)
    // throw new EmailError(`Failed to send welcome email: ${errorMessage}`)
  }
}
