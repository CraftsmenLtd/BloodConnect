import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  GoneException
} from '@aws-sdk/client-apigatewaymanagementapi'

// Thin wrapper over the API Gateway Management API used to push messages back to live WebSocket
// connections. The endpoint is derived per-invocation from the WebSocket event's requestContext
// (`https://<domainName>/<stage>`).
export default class WebSocketOperations {
  private readonly client: ApiGatewayManagementApiClient

  constructor(endpoint: string, region: string) {
    this.client = new ApiGatewayManagementApiClient({ endpoint, region })
  }

  // Posts data to a connection. Returns { gone: true } when the connection is stale (410), so the
  // caller can prune it; other errors propagate.
  async postToConnection(connectionId: string, data: unknown): Promise<{ gone: boolean }> {
    try {
      await this.client.send(new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(data))
      }))

      return { gone: false }
    } catch (error) {
      if (error instanceof GoneException) {
        return { gone: true }
      }
      throw error
    }
  }
}
