import { APIGatewayProxyResult } from 'aws-lambda'
import acceptDonationRequestLambda from '../../bloodDonation/acceptDonationRequest'
import { AcceptDonationService } from '../../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import { AcceptDonationRequestAttributes } from '../../../../application/bloodDonationWorkflow/Types'
import { acceptDonationRequestAttributesMock } from '../../../../application/tests/mocks/mockDonationAcceptanceData'

jest.mock('../../../../application/bloodDonationWorkflow/AcceptDonationRequestService')
jest.mock('../../commons/lambda/ApiGateway')

const mockAcceptDonationService = AcceptDonationService as jest.MockedClass<typeof AcceptDonationService>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('acceptDonationRequestLambda', () => {
  const mockEvent: AcceptDonationRequestAttributes = { ...acceptDonationRequestAttributesMock }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return a successful response when donation request is accepted', async() => {
    const mockResponse = 'Donation request accepted successfully'

    mockAcceptDonationService.prototype.createAcceptanceRecord.mockResolvedValue(mockResponse)
    mockGenerateApiGatewayResponse.mockReturnValue({ statusCode: HTTP_CODES.OK, body: JSON.stringify(mockResponse) })

    const result: APIGatewayProxyResult = await acceptDonationRequestLambda(mockEvent)
    expect(result).toEqual({ statusCode: HTTP_CODES.OK, body: JSON.stringify(mockResponse) })
    expect(mockAcceptDonationService.prototype.createAcceptanceRecord).toHaveBeenCalledWith(mockEvent, expect.anything(), expect.anything())
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith({ message: mockResponse }, HTTP_CODES.OK)
  })

  it('should return an error response when an error is thrown', async() => {
    const errorMessage = 'Database connection failed'
    mockAcceptDonationService.prototype.createAcceptanceRecord.mockRejectedValue(new Error(errorMessage))
    mockGenerateApiGatewayResponse.mockReturnValue({ statusCode: HTTP_CODES.ERROR, body: `Error: ${errorMessage}` })

    const result: APIGatewayProxyResult = await acceptDonationRequestLambda(mockEvent)
    expect(result).toEqual({ statusCode: HTTP_CODES.ERROR, body: `Error: ${errorMessage}` })
    expect(mockAcceptDonationService.prototype.createAcceptanceRecord).toHaveBeenCalledWith(mockEvent, expect.anything(), expect.anything())
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  })
})
