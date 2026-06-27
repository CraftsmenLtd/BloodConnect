import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi'

// Thin wrapper over the API Gateway Management API postToConnection call so the
// chat handler can push a real-time frame to a recipient's WebSocket connection.
// Kept as a class with an injectable endpoint so it is mockable with
// aws-sdk-client-mock (the connection endpoint is derived per-invocation from the
// WebSocket requestContext domainName/stage).
export default class ManagementApiOperations {
  private readonly client: ApiGatewayManagementApiClient

  constructor(endpoint: string, region: string) {
    this.client = new ApiGatewayManagementApiClient({ endpoint, region })
  }

  async postToConnection(connectionId: string, payload: unknown): Promise<void> {
    await this.client.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(payload))
    }))
  }
}
