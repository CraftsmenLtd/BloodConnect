import type { 
  AttributeValue, 
  QueryCommandInput, 
  GetItemCommandInput, 
  DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import type { 
  BloodRequestDynamoDBUnmarshaledItem,
  NotificationDynamoDBUnmarshaledItem,
  UserLocationDynamoDBUnmarshaledItem } from '../../constants/types';
import type { DonationStatus } from '../../../../../commons/dto/DonationDTO';


export type QueryDonationsInput = {
  startTime: number;
  endTime: number;
  geoPartition: string;
  country: string;
  status: DonationStatus;
  nextPageToken?: Record<string, AttributeValue>;
};

export const queryRequests = async(
  dynamodbClient: DynamoDBClient,
  {
    startTime,
    endTime,
    geoPartition,
    country,
    status,
    nextPageToken,
  }: QueryDonationsInput): Promise<{
    items: BloodRequestDynamoDBUnmarshaledItem[];
    nextPageToken?: Record<string, AttributeValue>;
  }> => {
  const nowIso = new Date(startTime).toISOString()
  const endIso = new Date(endTime).toISOString()

  const gsi1pk = `LOCATION#${country}-${geoPartition}#STATUS#${status}`

  const input: QueryCommandInput = {
    TableName: import.meta.env.VITE_AWS_DYNAMODB_TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :gsi1pk',
    FilterExpression: 'donationDateTime BETWEEN :start AND :end',
    ExpressionAttributeValues: {
      ':gsi1pk': { S: gsi1pk },
      ':start': { S: nowIso },
      ':end': { S: endIso },
    },
    ScanIndexForward: false,
    Limit: 10,
    ExclusiveStartKey: nextPageToken,
  }

  const command = new QueryCommand(input)
  const response = await dynamodbClient.send(command)

  return {
    items: (response.Items ?? []) as BloodRequestDynamoDBUnmarshaledItem[],
    nextPageToken: response.LastEvaluatedKey,
  }
}


export const queryNotifiedDonors = async(
  dynamodbClient: DynamoDBClient,
  { requestId }: {requestId: string},
  nextPageToken?: Record<string, AttributeValue>) => {
  const input: QueryCommandInput = {
    TableName: import.meta.env.VITE_AWS_DYNAMODB_TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :prefix)',
    FilterExpression: 'SK = :sk',
    ExpressionAttributeValues: {
      ':sk': { S: `BLOOD_REQ_POST#${requestId}` },
      ':gsi1pk': { S: requestId },
      ':prefix': { S: 'NOTIFICATION#' }
    },
    ScanIndexForward: false,
    Limit: 100,
    ExclusiveStartKey: nextPageToken,
  }

  const command = new QueryCommand(input)
  const response = await dynamodbClient.send(command)
  return {
    items: (response.Items ?? []) as NotificationDynamoDBUnmarshaledItem[],
    nextPageToken: response.LastEvaluatedKey,
  }
}

export const queryUserLocation = async(
  dynamodbClient: DynamoDBClient,
  { locationId, userId }:{ locationId: string; userId: string }) => {
  const input: GetItemCommandInput = {
    TableName: import.meta.env.VITE_AWS_DYNAMODB_TABLE,
    Key: {
      PK: { S: `USER#${userId}` },
      SK: { S: `LOCATION#${locationId}` },
    },
  }

  const command = new GetItemCommand(input)
  const response = await dynamodbClient.send(command)

  return response.Item as UserLocationDynamoDBUnmarshaledItem
}
