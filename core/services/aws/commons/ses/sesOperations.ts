import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { GenericMessage } from '../../../../../commons/dto/MessageDTO'
const sesClient = new SESClient({ region: process.env.AWS_REGION })

interface SendWelcomeEmailParams {
  email: string;
  emailContent: GenericMessage;
}

export async function sendAppUserWellcomeMail({ email, emailContent }: SendWelcomeEmailParams): Promise<void> {
  const { title, content } = emailContent

  const emailParams = {
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Body: {
        Html: { Data: title }
      },
      Subject: { Data: content }
    },
    Source: 'no-reply@bloodconnect.net'
  }

  try {
    await sesClient.send(new SendEmailCommand(emailParams))
    // eslint-disable-next-line no-console
    console.log(`App User welcome email sent successfully to ${email}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    throw new Error(`Failed to send welcome email: ${errorMessage}`)
  }
}
