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
import { BloodDonationService } from '../../../../application/bloodDonationWorkflow/BloodDonationService'
import { mockDonationDTO } from '../../../../application/tests/mocks/mockDonationRequestData'

jest.mock('../../../../application/bloodDonationWorkflow/AcceptDonationRequestService')
jest.mock('../../../../application/notificationWorkflow/NotificationService')
jest.mock('../../../../application/userWorkflow/UserService')
jest.mock('../../../../application/bloodDonationWorkflow/BloodDonationService')
jest.mock('../../commons/lambda/ApiGateway')

const mockAcceptDonationService = AcceptDonationService as jest.MockedClass<typeof AcceptDonationService>
const mockNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>
const mockUserService = UserService as jest.MockedClass<typeof UserService>
const mockBloodDonationService = BloodDonationService as jest.MockedClass<typeof BloodDonationService>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('acceptDonationRequestLambda', () => {
  const mockEvent: AcceptDonationRequestAttributes = { ...acceptDonationRequestAttributesMock }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return a successful response when donation request is accepted', async() => {
    const mockResponse = 'Donation request accepted successfully'

    mockUserService.prototype.getUser.mockResolvedValue(mockUserDetailsWithStringId)
    mockBloodDonationService.prototype.getDonationRequest.mockResolvedValue(mockDonationDTO)
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
    expect(mockBloodDonationService.prototype.getDonationRequest).toHaveBeenCalledWith(
      mockEvent.seekerId,
      mockEvent.requestPostId,
      mockEvent.createdAt,
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
      mockUserDetailsWithStringId,
      expect.anything()
    )
    expect(mockNotificationService.prototype.sendNotification).toHaveBeenCalledWith(
      {
        userId: mockEvent.seekerId,
        title: 'Donor Found',
        body: `${mockDonationDTO.neededBloodGroup} blood found`,
        type: 'REQ_ACCEPTED',
        payload: expect.objectContaining({
          donorId: mockEvent.donorId,
          donorName: mockUserDetailsWithStringId.name,
          neededBloodGroup: mockDonationDTO.neededBloodGroup
        })
      },
      expect.anything()
    )
  })

  it('should return an error response when user does not exist', async() => {
    const errorMessage = 'Cannot find user'

    mockUserService.prototype.getUser.mockResolvedValue(mockUserDetailsWithStringId)
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
  })

  it('should return an error response when donation post is not pending', async() => {
    const errorMessage = 'Donation request is no longer available for acceptance.'

    mockUserService.prototype.getUser.mockResolvedValue(mockUserDetailsWithStringId)
    mockBloodDonationService.prototype.getDonationRequest.mockResolvedValue(mockDonationDTO)
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
    expect(mockBloodDonationService.prototype.getDonationRequest).toHaveBeenCalledWith(
      mockEvent.seekerId,
      mockEvent.requestPostId,
      mockEvent.createdAt,
      expect.anything()
    )
  })
})
