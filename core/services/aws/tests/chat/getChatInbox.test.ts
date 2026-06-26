import getChatInbox from '../../chat/getChatInbox'
import { ChatService } from '../../../../application/chatWorkflow/ChatService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import { CHAT_INBOX_FETCHED_SUCCESS } from '../../../../../commons/libs/constants/ApiResponseMessages'

jest.mock('../../../../application/chatWorkflow/ChatService')
jest.mock('../../commons/lambda/ApiGateway')
jest.mock('../../commons/logger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

const mockChatService = ChatService as jest.MockedClass<typeof ChatService>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

const mockEvent = {
  userId: 'user-1',
  apiGwRequestId: 'req-1',
  cloudFrontRequestId: 'cf-1'
}

describe('getChatInbox', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the inbox channels for the authenticated user', async () => {
    const channels = [{ userId: 'user-1', channelId: 'channel-1', unreadCount: 2, updatedAt: 'x' }]
    mockChatService.prototype.getInbox.mockResolvedValue({ items: channels })
    mockGenerateApiGatewayResponse.mockReturnValue({ statusCode: HTTP_CODES.OK, body: 'ok' })

    await getChatInbox(mockEvent)

    expect(mockChatService.prototype.getInbox).toHaveBeenCalledWith('user-1', undefined, undefined)
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      {
        success: true,
        message: CHAT_INBOX_FETCHED_SUCCESS,
        data: { channels, lastEvaluatedKey: undefined }
      },
      HTTP_CODES.OK
    )
  })

  it('returns an error response when the service throws', async () => {
    mockChatService.prototype.getInbox.mockRejectedValue(new Error('db down'))
    mockGenerateApiGatewayResponse.mockReturnValue({ statusCode: HTTP_CODES.ERROR, body: 'err' })

    await getChatInbox(mockEvent)

    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      'Error: db down',
      HTTP_CODES.ERROR
    )
  })
})
