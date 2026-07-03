import type { Logger } from '../../../application/models/logger/Logger'
import ChatOperationError from '../../../application/chatWorkflow/ChatOperationError'

export type ChatWsRequestContext = {
  connectionId?: string;
  domainName?: string;
  stage?: string;
  authorizer?: { userId?: string };
}

export type ChatWsEvent = {
  requestContext: ChatWsRequestContext;
  body?: string | null;
  queryStringParameters?: Record<string, string | undefined> | null;
}

export const realtimeEndpoint = (context: ChatWsRequestContext): string =>
  process.env.WEBSOCKET_ENDPOINT ?? `https://${context.domainName}/${context.stage}`

export const wsErrorResponse = (
  error: unknown,
  logger: Logger,
  handlerName: string
): { statusCode: number } => {
  const statusCode = error instanceof ChatOperationError ? error.errorCode : 500
  logger.error({ error, handlerName }, 'websocket handler error')

  return { statusCode }
}
