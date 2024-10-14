import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn'
import { APIGatewayProxyResult } from 'aws-lambda'

const dynamoClient = new DynamoDBClient({})
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient)
const stepFunctionsClient = new SFNClient({})

const STEP_FUNCTION_ARN = process.env.STEP_FUNCTION_ARN!
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!

const TERMINAL_STATES = ['COMPLETED', 'CANCELLED']
const MAX_RETRY_COUNT = 2

async function getExistingRequest(donation_request_id: string) {
  const queryParams = {
    TableName: DYNAMODB_TABLE_NAME,
    KeyConditionExpression: 'pk = :donation_request_id',
    ExpressionAttributeValues: {
      ':donation_request_id': donation_request_id
    }
  }
  const result = await dynamoDocClient.send(new QueryCommand(queryParams))
  return result.Items?.[0]
}

async function putDynamoDBItem(pk: string, sk: string, attributes: Record<string, any>) {
  await dynamoDocClient.send(new PutCommand({
    TableName: DYNAMODB_TABLE_NAME,
    Item: { pk, sk, ...attributes }
  }))
}

async function RequestRouterLambda(event): Promise<APIGatewayProxyResult> {
  const body = event.Records?.[0]?.body ? JSON.parse(event.Records[0].body) : {}
  const { donation_request_id, number_of_bags_needed, blood_group, urgency_level, gohash, donation_centre } = body

  const existingItem = await getExistingRequest(donation_request_id)
  const retryCount = existingItem?.RetryCount || 0
  const numberOfBagsFound = existingItem?.number_of_bags_found || 0

  if (existingItem?.sk && TERMINAL_STATES.includes(existingItem.sk)) {
    return createResponse(200, 'Request is in terminal state (COMPLETED/CANCELLED).')
  }

  if (retryCount >= MAX_RETRY_COUNT) {
    await putDynamoDBItem(donation_request_id, 'CANCELLED', { ...existingItem, RetryCount: retryCount })
    return createResponse(200, 'Donor search cancelled after max retries.')
  }

  const updateItemData = {
    number_of_bags_needed: number_of_bags_needed || existingItem?.number_of_bags_needed,
    number_of_bags_found: numberOfBagsFound,
    blood_group: blood_group || existingItem?.blood_group,
    urgency_level: urgency_level || existingItem?.urgency_level,
    gohash: gohash || existingItem?.gohash,
    donation_centre: donation_centre || existingItem?.donation_centre,
    RetryCount: retryCount + 1
  }

  if (numberOfBagsFound >= updateItemData.number_of_bags_needed) {
    await putDynamoDBItem(donation_request_id, 'COMPLETED', updateItemData)
    return createResponse(200, 'Required number of donors found. Request completed.')
  }

  await putDynamoDBItem(donation_request_id, 'RUNNING', updateItemData)

  await stepFunctionsClient.send(new StartExecutionCommand({
    stateMachineArn: STEP_FUNCTION_ARN,
    input: JSON.stringify({ donation_request_id, ...updateItemData })
  }))

  return createResponse(200, 'Request routed successfully!')
}

function createResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    body: JSON.stringify({ message })
  }
}

export default RequestRouterLambda
