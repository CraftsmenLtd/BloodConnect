import { addPersonalInfoHandler, DonationResponse } from '../../src/userWorkflow/services/userServices'
import { HttpClient } from '../../src/setup/clients/HttpClient'

describe('addPersonalInfoHandler', () => {
  let httpClient: jest.Mocked<HttpClient>

  beforeEach(() => {
    httpClient = {
      patch: jest.fn()
    } as unknown as jest.Mocked<HttpClient>
  })

  it('should return a success response with message and status when request is successful', async() => {
    const payload = { name: 'John Doe', age: 30 }
    const mockResponse: DonationResponse = {
      success: true,
      message: 'User information updated successfully.',
      status: 200
    }

    httpClient.patch.mockResolvedValue(mockResponse as DonationResponse & { status: number })

    const result = await addPersonalInfoHandler(payload, httpClient)

    expect(result).toEqual({
      message: 'User information updated successfully.',
      status: 200
    })
    expect(httpClient.patch).toHaveBeenCalledWith('/users', payload)
  })

  it('should throw an error with the correct message when the request fails', async() => {
    const payload = { name: 'John Doe' }
    const mockError = new Error('Network error')
    httpClient.patch.mockRejectedValue(mockError)

    await expect(addPersonalInfoHandler(payload, httpClient)).rejects.toThrow('Network error')
    expect(httpClient.patch).toHaveBeenCalledWith('/users', payload)
  })

  it('should throw a generic error message when an unknown error occurs', async() => {
    const payload = { name: 'John Doe' }
    httpClient.patch.mockRejectedValue('An unexpected error')

    await expect(addPersonalInfoHandler(payload, httpClient)).rejects.toThrow('An unknown error occurred.')
    expect(httpClient.patch).toHaveBeenCalledWith('/users', payload)
  })
})
