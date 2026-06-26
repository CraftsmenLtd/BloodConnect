import type { HttpClient } from '../../setup/clients/HttpClient'
import type { ApiResponse } from '../../setup/clients/response'
import type { ChatHistoryData, ChatInboxData } from '../types'

export const fetchChatInbox = async(
  httpClient: HttpClient,
  params?: { limit?: number; nextKey?: string }
): Promise<ChatInboxData> => {
  try {
    const response = await httpClient.get<ApiResponse<ChatInboxData>>('/chat/inbox', params)

    return response.data ?? { channels: [] }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}

export const fetchChatHistory = async(
  httpClient: HttpClient,
  channelId: string,
  params?: { limit?: number; nextKey?: string }
): Promise<ChatHistoryData> => {
  try {
    const response = await httpClient.get<ApiResponse<ChatHistoryData>>(
      `/chat/${channelId}/messages`,
      params
    )

    return response.data ?? { messages: [] }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}
