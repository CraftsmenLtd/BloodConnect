import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  UpdateCommand,
  QueryCommand,
  GetCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb'
import { TransactionCanceledException } from '@aws-sdk/client-dynamodb'
import { SQS, SendMessageCommand } from '@aws-sdk/client-sqs'
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  GoneException
} from '@aws-sdk/client-apigatewaymanagementapi'
import { mockClient } from 'aws-sdk-client-mock'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import sendChatMessage from '../../chat/sendChatMessage'

jest.mock('../../../../../commons/libs/config/config', () => ({
  Config: jest.fn().mockImplementation(() => ({
    getConfig: () => ({
      dynamodbTableName: 'test-table',
      awsRegion: 'us-east-1',
      notificationQueueUrl: 'https://sqs/notification'
    })
  }))
}))

const FORBIDDEN_STATUS = 403
const RATE_LIMIT = 60
const ddbMock = mockClient(DynamoDBDocumentClient)
const apiMock = mockClient(ApiGatewayManagementApiClient)
const sqsMock = mockClient(SQS)

const channelId = 'seeker1#req1#donor1'
const senderId = 'seeker1'
const recipientId = 'donor1'

const activeChannelItem = {
  PK: `CHAT#${channelId}`,
  SK: 'METADATA',
  seekerId: senderId,
  donorId: recipientId,
  requestPostId: 'req1',
  status: 'ACTIVE',
  createdAt: '2026-06-26T00:00:00.000Z'
}

const connectionItem = (connectionId: string) => ({
  PK: `WSCONN#${recipientId}`,
  SK: connectionId,
  expiresAt: 9999999999
})

const buildEvent = (overrides: Record<string, unknown> = {}) => ({
  requestContext: {
    connectionId: 'sender-conn',
    domainName: 'ws.example.com',
    stage: 'prod',
    authorizer: { userId: senderId }
  },
  body: JSON.stringify({
    channelId,
    text: 'hello',
    messageId: 'm-1',
    clientCreatedAt: new Date().toISOString(),
    ...overrides
  })
})

// COUNT-select query (rate limit) is matched first; the generic query returns the
// recipient connections. Ordering matters: the specific matcher must precede the
// catch-all in aws-sdk-client-mock.
const primeDdb = (options: {
  connections?: ReturnType<typeof connectionItem>[];
  rateCount?: number;
  channelStatus?: string;
} = {}): void => {
  ddbMock.on(QueryCommand, { Select: 'COUNT' }).resolves({ Count: options.rateCount ?? 0 })
  ddbMock
    .on(QueryCommand, { ExpressionAttributeValues: { ':PK': `WSCONN#${recipientId}` } })
    .resolves({ Items: options.connections ?? [] })
  ddbMock.on(TransactWriteCommand).resolves({})
  ddbMock.on(UpdateCommand).resolves({})
  ddbMock.on(DeleteCommand).resolves({})
  ddbMock.on(GetCommand).resolves({
    Item: { ...activeChannelItem, status: options.channelStatus ?? 'ACTIVE' }
  })
}

beforeEach(() => {
  ddbMock.reset()
  apiMock.reset()
  sqsMock.reset()
  apiMock.on(PostToConnectionCommand).resolves({})
  sqsMock.on(SendMessageCommand).resolves({ MessageId: 'q-1' })
})

describe('sendChatMessage', () => {
  it('persists, increments unread, and delivers to a live recipient without pushing', async () => {
    primeDdb({ connections: [connectionItem('conn-1')] })

    const response = await sendChatMessage(buildEvent())

    expect(response.statusCode).toBe(HTTP_CODES.OK)
    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(1)
    expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(1)
    expect(apiMock.commandCalls(PostToConnectionCommand)).toHaveLength(1)
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(0)
  })

  it('does not duplicate the persist or the unread increment on a re-sent identical message', async () => {
    primeDdb()
    ddbMock.on(TransactWriteCommand)
      .resolvesOnce({})
      .rejects(new TransactionCanceledException({ message: 'duplicate', $metadata: {} }))

    const event = buildEvent({ clientCreatedAt: new Date().toISOString(), messageId: 'dup-1' })
    await sendChatMessage(event)
    const second = await sendChatMessage(event)

    expect(second.statusCode).toBe(HTTP_CODES.OK)
    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(2)
    expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(1)
  })

  it('enqueues exactly one push when the recipient has no live connection', async () => {
    primeDdb({ connections: [] })

    const response = await sendChatMessage(buildEvent())

    expect(response.statusCode).toBe(HTTP_CODES.OK)
    expect(apiMock.commandCalls(PostToConnectionCommand)).toHaveLength(0)
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1)
  })

  it('deletes a stale 410 connection and falls back to exactly one push', async () => {
    primeDdb({ connections: [connectionItem('stale-1')] })
    apiMock.on(PostToConnectionCommand)
      .rejects(new GoneException({ message: 'gone', $metadata: { httpStatusCode: 410 } }))

    const response = await sendChatMessage(buildEvent())

    expect(response.statusCode).toBe(HTTP_CODES.OK)
    const deletes = ddbMock.commandCalls(DeleteCommand)
    expect(deletes).toHaveLength(1)
    expect(deletes[0].args[0].input.Key).toEqual({ PK: `WSCONN#${recipientId}`, SK: 'stale-1' })
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1)
  })

  it('returns 403 when the channel is locked (conditional write fails)', async () => {
    primeDdb({ channelStatus: 'LOCKED' })
    ddbMock.on(TransactWriteCommand)
      .rejects(new TransactionCanceledException({ message: 'locked', $metadata: {} }))

    const response = await sendChatMessage(buildEvent())

    expect(response.statusCode).toBe(FORBIDDEN_STATUS)
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(0)
  })

  it('returns 429 once the per-minute rate limit is reached', async () => {
    primeDdb({ rateCount: RATE_LIMIT })

    const response = await sendChatMessage(buildEvent())

    expect(response.statusCode).toBe(HTTP_CODES.TOO_MANY_REQUESTS)
    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(0)
  })

  it('rejects a send whose senderId is absent from the authorizer context', async () => {
    primeDdb()
    const event = buildEvent()
    event.requestContext.authorizer = { userId: '' }

    const response = await sendChatMessage(event)

    expect(response.statusCode).toBe(HTTP_CODES.UNAUTHORIZED)
    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(0)
  })

  it('rejects a malformed payload with 400 before touching the service', async () => {
    primeDdb()
    const event = { ...buildEvent(), body: '{"text":"hi"}' }

    const response = await sendChatMessage(event)

    expect(response.statusCode).toBe(HTTP_CODES.BAD_REQUEST)
    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(0)
  })
})
