import type { HttpClient } from '../setup/clients/HttpClient'
import type { ApiResponse } from '../setup/clients/response'
import type { ChatHistoryResult, ChatMembershipDTO } from './chatTypes'

export type ChatChannelsResponse = ApiResponse<ChatMembershipDTO[]>
export type ChatHistoryResponse = ApiResponse<ChatHistoryResult>

// Lists the caller's chat channels (their membership items). Claim-only GET.
export const fetchChatChannels = async(httpClient: HttpClient): Promise<ChatChannelsResponse> => {
  try {
    const response = await httpClient.get<ChatChannelsResponse>('/chat/channels')

    return { data: response.data, status: response.status }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}

// Newest-first, paginated history for a channel. The composite channelId and the opaque cursor ride
// the JSON body (a path param would need '#' encoding and the cursor cannot ride a query string).
export const fetchChatHistory = async(
  channelId: string,
  httpClient: HttpClient,
  limit?: number,
  exclusiveStartKey?: Record<string, unknown>
): Promise<ChatHistoryResponse> => {
  try {
    const body: Record<string, unknown> = { channelId }
    if (limit !== undefined) body.limit = limit
    if (exclusiveStartKey !== undefined) body.exclusiveStartKey = exclusiveStartKey

    const response = await httpClient.post<ChatHistoryResponse>('/chat/history', body)

    return { data: response.data, status: response.status }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}

// Updates the caller's own lastReadAt marker on the channel.
export const markChatRead = async(
  channelId: string,
  httpClient: HttpClient
): Promise<ApiResponse> => {
  try {
    const response = await httpClient.patch<ApiResponse>('/chat/read', { channelId })

    return { message: response.message, status: response.status, success: response.success }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}
