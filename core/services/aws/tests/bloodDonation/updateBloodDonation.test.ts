import updateBloodDonationLambda from '../../bloodDonation/updateBloodDonation'
import { BloodDonationService } from '../../../../application/bloodDonationWorkflow/BloodDonationService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import { mockEvent } from '../cannedData/updateBloodDonationLambdaEvent'

jest.mock('../../../../application/bloodDonationWorkflow/BloodDonationService')
jest.mock('../../commons/lambda/ApiGateway')

const mockBloodDonationService = BloodDonationService as jest.MockedClass<typeof BloodDonationService>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('updateBloodDonationLambda', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return a successful response when blood donation is updated', async() => {
    const mockResponse = 'Blood donation updated successfully'
    mockBloodDonationService.prototype.updateBloodDonation.mockResolvedValue(mockResponse)
    mockGenerateApiGatewayResponse.mockReturnValue({ statusCode: HTTP_CODES.OK, body: JSON.stringify(mockResponse) })

    const result = await updateBloodDonationLambda(mockEvent)

    expect(result).toEqual({ statusCode: HTTP_CODES.OK, body: JSON.stringify(mockResponse) })
    expect(mockBloodDonationService.prototype.updateBloodDonation).toHaveBeenCalledWith({ ...mockEvent }, expect.anything())
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(mockResponse, HTTP_CODES.OK)
  })

  it('should return an error response when an error is thrown', async() => {
    const errorMessage = 'Database update failed'
    mockBloodDonationService.prototype.updateBloodDonation.mockRejectedValue(new Error(errorMessage))
    mockGenerateApiGatewayResponse.mockReturnValue({ statusCode: HTTP_CODES.ERROR, body: `Error: ${errorMessage}` })

    const result = await updateBloodDonationLambda(mockEvent)

    expect(result).toEqual({ statusCode: HTTP_CODES.ERROR, body: `Error: ${errorMessage}` })
    expect(mockBloodDonationService.prototype.updateBloodDonation).toHaveBeenCalledWith({ ...mockEvent }, expect.anything())
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  })

  it('should only include allowed keys in the update attributes', async() => {
    const mockResponse = 'Blood donation updated successfully'
    const filteredEvent = {
      ...mockEvent,
      invalidKey: 'invalidValue'
    }

    mockBloodDonationService.prototype.updateBloodDonation.mockResolvedValue(mockResponse)
    mockGenerateApiGatewayResponse.mockReturnValue({ statusCode: HTTP_CODES.OK, body: JSON.stringify(mockResponse) })

    const result = await updateBloodDonationLambda(filteredEvent)

    expect(result).toEqual({ statusCode: HTTP_CODES.OK, body: JSON.stringify(mockResponse) })
    expect(mockBloodDonationService.prototype.updateBloodDonation).toHaveBeenCalledWith({ ...mockEvent }, expect.anything())
  })
})
