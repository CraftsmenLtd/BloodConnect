import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi'

/**
 * Thin wrapper over API Gateway Management API for pushing frames to websocket
 * connections. `post` returns false when the connection is gone (410) so the
 * caller can purge the stale connection registry entry.
 */
export default class WebSocketClient {
  private readonly client: ApiGatewayManagementApiClient

  constructor(endpoint: string, region: string) {
    this.client = new ApiGatewayManagementApiClient({ endpoint, region })
  }

  static endpointFrom(domainName: string, stage: string): string {
    return `https://${domainName}/${stage}`
  }

  async post(connectionId: string, payload: unknown): Promise<boolean> {
    try {
      await this.client.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: Buffer.from(JSON.stringify(payload))
        })
      )

      return true
    } catch (error) {
      const statusCode = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode

      if (statusCode === 410) {
        return false
      }
      throw error
    }
  }
}
