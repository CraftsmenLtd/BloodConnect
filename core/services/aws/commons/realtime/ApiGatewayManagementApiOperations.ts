import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi'
import type { RealtimeNotifier } from '../../../../application/models/realtime/RealtimeNotifier'
import type { ChatRealtimeEvent } from '../../../../../commons/dto/ChatDTO'

export default class ApiGatewayManagementApiOperations implements RealtimeNotifier {
  private readonly client: ApiGatewayManagementApiClient

  constructor(endpoint: string, region: string) {
    this.client = new ApiGatewayManagementApiClient({ endpoint, region })
  }

  async postToConnections(
    connectionIds: string[],
    event: ChatRealtimeEvent
  ): Promise<{ staleConnectionIds: string[] }> {
    const data = Buffer.from(JSON.stringify(event))
    const staleConnectionIds: string[] = []

    await Promise.all(
      connectionIds.map(async (connectionId) => {
        try {
          await this.client.send(
            new PostToConnectionCommand({ ConnectionId: connectionId, Data: data })
          )
        } catch (error) {
          if (error instanceof Error && error.name === 'GoneException') {
            staleConnectionIds.push(connectionId)
          }
        }
      })
    )

    return { staleConnectionIds }
  }
}
