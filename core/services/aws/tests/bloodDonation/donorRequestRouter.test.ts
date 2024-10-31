import { APIGatewayProxyResult } from 'aws-lambda'
import createBloodDonationLambda from '../../bloodDonation/createBloodDonation'
import { BloodDonationService } from '../../../../application/bloodDonationWorkflow/BloodDonationService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import { BloodDonationAttributes } from '../../../../application/bloodDonationWorkflow/Types'
import { donationAttributesMock } from '../../../../application/tests/mocks/mockDonationRequestData'

jest.mock('../../../../application/bloodDonationWorkflow/BloodDonationService')
jest.mock('../../commons/lambda/ApiGateway')

const mockBloodDonationService = BloodDonationService as jest.MockedClass<typeof BloodDonationService>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('createBloodDonationLambda', () => {
  const { shortDescription, ...rest } = donationAttributesMock
  const mockEvent: BloodDonationAttributes = { ...rest }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return a successful response when blood donation is created', async() => {
    const mockResponse = 'Blood donation created successfully'

    mockBloodDonationService.prototype.createBloodDonation.mockResolvedValue(mockResponse)
    mockGenerateApiGatewayResponse.mockReturnValue({ statusCode: HTTP_CODES.OK, body: JSON.stringify(mockResponse) })

    const result: APIGatewayProxyResult = await createBloodDonationLambda({ ...mockEvent })
    expect(result).toEqual({ statusCode: HTTP_CODES.OK, body: JSON.stringify(mockResponse) })
    expect(mockBloodDonationService.prototype.createBloodDonation).toHaveBeenCalledWith({ ...mockEvent }, expect.anything())
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith({ message: mockResponse }, HTTP_CODES.OK)
  })

  it('should return an error response when an error is thrown', async() => {
    const errorMessage = 'Database connection failed'
    mockBloodDonationService.prototype.createBloodDonation.mockRejectedValue(new Error(errorMessage))
    mockGenerateApiGatewayResponse.mockReturnValue({ statusCode: HTTP_CODES.ERROR, body: `${errorMessage}` })

    const result: APIGatewayProxyResult = await createBloodDonationLambda(mockEvent)
    expect(result).toEqual({ statusCode: HTTP_CODES.ERROR, body: `${errorMessage}` })
    expect(mockBloodDonationService.prototype.createBloodDonation).toHaveBeenCalledWith({ ...mockEvent }, expect.anything())
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(`${errorMessage}`, HTTP_CODES.ERROR)
  })
})
