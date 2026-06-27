import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import connectChatSession from '../../chat/connectChatSession'
import disconnectChatSession from '../../chat/disconnectChatSession'

jest.mock('../../../../../commons/libs/config/config', () => ({
  Config: jest.fn().mockImplementation(() => ({
    getConfig: () => ({ dynamodbTableName: 'test-table', awsRegion: 'us-east-1' })
  }))
}))

const ddbMock = mockClient(DynamoDBDocumentClient)
const userId = 'donor1'
const connectionId = 'conn-1'

const buildEvent = (authorizer: { userId?: string } | null) => ({
  requestContext: { connectionId, authorizer }
})

describe('connectChatSession', () => {
  beforeEach(() => {
    ddbMock.reset()
  })

  it('stores a WSCONN record for the authorizer-derived user on $connect', async() => {
    ddbMock.on(PutCommand).resolves({ $metadata: { httpStatusCode: 200 } })

    const response = await connectChatSession(buildEvent({ userId }))

    expect(response.statusCode).toBe(HTTP_CODES.OK)
    const input = ddbMock.commandCalls(PutCommand)[0].args[0].input
    expect(input.Item?.PK).toBe('WSCONN#donor1')
    expect(input.Item?.SK).toBe('conn-1')
  })

  it('rejects a $connect with no authorizer context without writing', async() => {
    const response = await connectChatSession(buildEvent(null))

    expect(response.statusCode).toBe(HTTP_CODES.UNAUTHORIZED)
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0)
  })

  it('rejects a $connect with an empty userId without writing', async() => {
    const response = await connectChatSession(buildEvent({ userId: '' }))

    expect(response.statusCode).toBe(HTTP_CODES.UNAUTHORIZED)
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0)
  })
})

describe('disconnectChatSession', () => {
  beforeEach(() => {
    ddbMock.reset()
  })

  it('removes the WSCONN record for the user on $disconnect', async() => {
    ddbMock.on(DeleteCommand).resolves({ $metadata: { httpStatusCode: 200 } })

    const response = await disconnectChatSession(buildEvent({ userId }))

    expect(response.statusCode).toBe(HTTP_CODES.OK)
    const input = ddbMock.commandCalls(DeleteCommand)[0].args[0].input
    expect(input.Key).toEqual({ PK: 'WSCONN#donor1', SK: 'conn-1' })
  })
})
