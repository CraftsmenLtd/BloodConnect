import type { HttpClient } from '../../setup/clients/HttpClient'
import type { ApiResponse } from '../../setup/clients/response'
import type {
  ChatHistoryQueryDTO,
  ChatHistoryResultDTO,
  ChatMessageDTO
} from '../../../../../commons/dto/ChatDTO'
import type { OutgoingChatMessage } from '../types'

const CHAT_BASE_PATH = '/chat'

export type ChatHistoryResponse = ChatHistoryResultDTO & { status?: number }
export type MarkReadResponse = ApiResponse
export type SendMessageResponse = ApiResponse<ChatMessageDTO>

const toChatError = (error: unknown): Error => {
  const message = error instanceof Error ? error.message : 'An unknown error occurred.'

  return new Error(message)
}

const buildHistoryParams = (query: ChatHistoryQueryDTO): Record<string, string | number> => {
  const params: Record<string, string | number> = {}
  if (query.limit !== undefined) params.limit = query.limit
  if (query.lastEvaluatedKey !== undefined) params.cursor = JSON.stringify(query.lastEvaluatedKey)

  return params
}

export const fetchChatHistory = async(
  query: ChatHistoryQueryDTO,
  httpClient: HttpClient
): Promise<ChatHistoryResultDTO> => {
  try {
    const response = await httpClient.get<ChatHistoryResponse>(
      `${CHAT_BASE_PATH}/${query.channelId}/messages`,
      buildHistoryParams(query)
    )

    return { messages: response.messages ?? [], lastEvaluatedKey: response.lastEvaluatedKey }
  } catch (error) {
    throw toChatError(error)
  }
}

export const markChannelRead = async(
  channelId: string,
  httpClient: HttpClient
): Promise<MarkReadResponse> => {
  try {
    const response = await httpClient.post<MarkReadResponse>(`${CHAT_BASE_PATH}/${channelId}/read`, {})

    return { message: response.message, success: response.success, status: response.status }
  } catch (error) {
    throw toChatError(error)
  }
}

export const sendChatMessageRest = async(
  message: OutgoingChatMessage,
  httpClient: HttpClient
): Promise<SendMessageResponse> => {
  try {
    const body = { messageId: message.messageId, text: message.text, createdAt: message.createdAt }
    const response = await httpClient.post<SendMessageResponse>(
      `${CHAT_BASE_PATH}/${message.channelId}/messages`,
      body
    )

    return { data: response.data, status: response.status }
  } catch (error) {
    throw toChatError(error)
  }
}
