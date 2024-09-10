import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { PostConfirmationTriggerEvent, Callback, Context } from 'aws-lambda'
import KSUID from 'ksuid'

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION })

// TODO: Refactor to separate the database logic from the Lambda handler for better separation of concerns.
function postConfirmationLambda(
  event: PostConfirmationTriggerEvent,
  _: Context,
  callback: Callback<PostConfirmationTriggerEvent>
): void {
  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    const ksuid = KSUID.randomSync()
    const userData = {
      pk: `USER#${ksuid}`,
      sk: 'PROFILE',
      email: event.request.userAttributes.email,
      name: event.request.userAttributes.name,
      phone: event.request.userAttributes.phone_number,
      registrationDate: new Date().toISOString()
    }

    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Item: userData
    }

    dynamoDBClient.send(new PutCommand(params))
      .then(() => {
        callback(null, event)
      })
      .catch((error) => {
        callback(error)
      })
  } else {
    callback(null, event)
  }
}

export default postConfirmationLambda
