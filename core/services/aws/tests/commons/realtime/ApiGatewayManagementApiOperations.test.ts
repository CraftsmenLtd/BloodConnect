import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi'
import { mockClient } from 'aws-sdk-client-mock'
import ApiGatewayManagementApiOperations from '../../../commons/realtime/ApiGatewayManagementApiOperations'
import { ChatRealtimeEventType } from '../../../../../../commons/dto/ChatDTO'

const event = {
  type: ChatRealtimeEventType.TYPING as const,
  channelId: 'req-1#donor-1',
  userId: 'seeker-1'
}

describe('ApiGatewayManagementApiOperations', () => {
  const apiMock = mockClient(ApiGatewayManagementApiClient)
  const operations = new ApiGatewayManagementApiOperations('https://ws.example/dev', 'ap-south-1')

  beforeEach(() => apiMock.reset())

  it('posts to every connection and reports none stale on success', async () => {
    apiMock.on(PostToConnectionCommand).resolves({})

    const result = await operations.postToConnections(['c1', 'c2'], event)

    expect(result.staleConnectionIds).toEqual([])
    expect(apiMock.commandCalls(PostToConnectionCommand)).toHaveLength(2)
  })

  it('collects connections that return GoneException as stale', async () => {
    const gone = new Error('gone')
    gone.name = 'GoneException'
    apiMock.on(PostToConnectionCommand, { ConnectionId: 'gone' }).rejects(gone)
    apiMock.on(PostToConnectionCommand, { ConnectionId: 'live' }).resolves({})

    const result = await operations.postToConnections(['gone', 'live'], event)

    expect(result.staleConnectionIds).toEqual(['gone'])
  })

  it('does not mark non-Gone errors as stale', async () => {
    const other = new Error('throttled')
    other.name = 'LimitExceededException'
    apiMock.on(PostToConnectionCommand).rejects(other)

    const result = await operations.postToConnections(['c1'], event)

    expect(result.staleConnectionIds).toEqual([])
  })
})
