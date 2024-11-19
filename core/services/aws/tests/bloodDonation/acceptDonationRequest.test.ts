import { APIGatewayProxyResult } from 'aws-lambda'
import acceptDonationRequestLambda from '../../bloodDonation/acceptDonationRequest'
import { AcceptDonationService } from '../../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import { AcceptDonationRequestAttributes } from '../../../../application/bloodDonationWorkflow/Types'
import { acceptDonationRequestAttributesMock } from '../../../../application/tests/mocks/mockDonationAcceptanceData'
import { NotificationService } from '../../../../application/notificationWorkflow/NotificationService'
import { UserService } from '../../../../application/userWorkflow/UserService'
import { mockUserDetailsWithStringId } from '../../../../application/tests/mocks/mockUserData'

jest.mock('../../../../application/bloodDonationWorkflow/AcceptDonationRequestService')
jest.mock('../../../../application/notificationWorkflow/NotificationService')
jest.mock('../../../../application/userWorkflow/UserService')
jest.mock('../../commons/lambda/ApiGateway')

const mockAcceptDonationService = AcceptDonationService as jest.MockedClass<typeof AcceptDonationService>
const mockNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>
const mockUserService = UserService as jest.MockedClass<typeof UserService>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('acceptDonationRequestLambda', () => {
  const mockEvent: AcceptDonationRequestAttributes = { ...acceptDonationRequestAttributesMock }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return a successful response when donation request is accepted', async() => {
    const mockResponse = 'Donation request accepted successfully'

    mockUserService.prototype.getUser.mockResolvedValue(mockUserDetailsWithStringId)
    mockAcceptDonationService.prototype.createAcceptanceRecord.mockResolvedValue(mockResponse)
    mockNotificationService.prototype.sendNotification.mockResolvedValue('Notified user successfully.')
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: mockResponse })
    })

    const result: APIGatewayProxyResult = await acceptDonationRequestLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: mockResponse })
    })
    expect(mockUserService.prototype.getUser).toHaveBeenCalledWith(
      mockEvent.donorId,
      expect.anything()
    )
    expect(mockAcceptDonationService.prototype.createAcceptanceRecord).toHaveBeenCalledWith(
      {
        donorId: mockEvent.donorId,
        seekerId: mockEvent.seekerId,
        createdAt: mockEvent.createdAt,
        requestPostId: mockEvent.requestPostId,
        acceptanceTime: mockEvent.acceptanceTime
      },
      expect.anything(),
      expect.anything()
    )
    expect(mockNotificationService.prototype.sendNotification).toHaveBeenCalledWith(
      {
        userId: mockEvent.seekerId,
        title: 'Donor Found',
        body: `${mockUserDetailsWithStringId.bloodGroup} blood found`,
        type: 'donorAcceptRequest',
        payload: {
          seekerId: mockEvent.seekerId,
          createdAt: mockEvent.createdAt,
          requestPostId: mockEvent.requestPostId,
          donorId: mockEvent.donorId,
          name: mockUserDetailsWithStringId.name,
          bloodGroup: mockUserDetailsWithStringId.bloodGroup
        }
      },
      expect.anything()
    )
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { message: mockResponse },
      HTTP_CODES.OK
    )
  })

  it('should return an error response when an error is thrown', async() => {
    const errorMessage = 'Database connection failed'
    mockUserService.prototype.getUser.mockRejectedValue(new Error(errorMessage))
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await acceptDonationRequestLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })
    expect(mockUserService.prototype.getUser).toHaveBeenCalledWith(
      mockEvent.donorId,
      expect.anything()
    )
    expect(mockAcceptDonationService.prototype.createAcceptanceRecord).not.toHaveBeenCalled()
    expect(mockNotificationService.prototype.sendNotification).not.toHaveBeenCalled()
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${errorMessage}`,
      HTTP_CODES.ERROR
    )
  })
})
