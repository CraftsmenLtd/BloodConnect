import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'

const sqsClient = new SQSClient({ region: 'us-east-1' })

const DONOR_SEARCH_RETRY_QUEUE_URL = process.env.DONOR_SEARCH_RETRY_QUEUE_URL

export default async(event: any) => {
  try {
    const { donation_request_id, number_of_bags_needed, blood_group, urgency_level, gohash, donation_centre } = event

    const messageBody = JSON.stringify({
      donation_request_id,
      number_of_bags_needed,
      blood_group,
      urgency_level,
      gohash,
      donation_centre
    })

    const sendMessageParams = {
      QueueUrl: DONOR_SEARCH_RETRY_QUEUE_URL,
      MessageBody: messageBody,
      DelaySeconds: 60
    }

    const sendMessageCommand = new SendMessageCommand(sendMessageParams)
    const result = await sqsClient.send(sendMessageCommand)

    console.log(`Message sent to retry queue: ${result.MessageId}`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Message successfully added to retry queue',
        messageId: result.MessageId
      })
    }
  } catch (error) {
    console.error('Error sending message to retry queue:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to send message to retry queue',
        error: error.message
      })
    }
  }
}
