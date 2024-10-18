import { FetchClient, FetchResponse } from '../../../src/setup/clients/FetchClient'
import { FetchClientError } from '../../../src/setup/clients/FetchClientError'
import StorageService from '../../../src/utility/storageService'
import authService from '../../../src/authentication/authService'

// Mock the required services
jest.mock('../../../src/utility/storageService')
jest.mock('../../../src/authentication/authService')

describe('FetchClient', () => {
  const baseURL = 'https://api.example.com'
  const fetchClient = new FetchClient(baseURL)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize with baseURL', () => {
    expect(fetchClient).toBeDefined()
  })

  test('should load idToken from storage', async() => {
    (StorageService.getItem as jest.Mock).mockResolvedValue('mockIdToken')

    const idToken = await fetchClient.loadIdToken()
    expect(idToken).toBe('mockIdToken')
    expect(StorageService.getItem).toHaveBeenCalledWith('idToken')
  })

  test('should setup request headers with idToken', async() => {
    (StorageService.getItem as jest.Mock).mockResolvedValue('mockIdToken');
    (authService.decodeAccessToken as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 })

    const headers = await fetchClient.setupRequestHeaders({})
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer mockIdToken'
    })
  })

  test('should refresh idToken if expired', async() => {
    (StorageService.getItem as jest.Mock).mockResolvedValue('mockExpiredIdToken');
    (authService.decodeAccessToken as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) - 1 });
    (authService.fetchSession as jest.Mock).mockResolvedValue({ idToken: 'newIdToken' })

    const headers = await fetchClient.setupRequestHeaders({})
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer newIdToken'
    })
    expect(authService.fetchSession).toHaveBeenCalled()
  })

  test('should not refresh idToken if valid', async() => {
    (StorageService.getItem as jest.Mock).mockResolvedValue('mockValidIdToken');
    (authService.decodeAccessToken as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 })

    const headers = await fetchClient.setupRequestHeaders({})
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer mockValidIdToken'
    })
    expect(authService.fetchSession).not.toHaveBeenCalled()
  })

  test('should perform a GET request', async() => {
    const mockResponse: FetchResponse<any> = { data: { key: 'value' }, status: 200 }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponse.data)
    })

    const response = await fetchClient.get('/endpoint', { key: 'value' })
    expect(response).toEqual(mockResponse.data)
    expect(global.fetch).toHaveBeenCalledWith(`${baseURL}/endpoint?key=value`, expect.any(Object))
  })

  test('should throw FetchClientError on GET request failure', async() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue('Bad Request')
    })

    await expect(fetchClient.get('/endpoint')).rejects.toThrow(FetchClientError)
    await expect(fetchClient.get('/endpoint')).rejects.toThrow('Bad Request')
  })

  test('should perform a POST request', async() => {
    const mockResponse: FetchResponse<any> = { data: { key: 'value' }, status: 201 }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue(mockResponse.data)
    })

    const response = await fetchClient.post('/endpoint', { key: 'value' })
    expect(response).toEqual(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(`${baseURL}/endpoint`, expect.any(Object))
  })

  test('should throw FetchClientError on POST request failure', async() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('Server Error')
    })

    await expect(fetchClient.post('/endpoint', { key: 'value' })).rejects.toThrow(FetchClientError)
    await expect(fetchClient.post('/endpoint', { key: 'value' })).rejects.toThrow('Server Error')
  })

  test('should handle unexpected errors gracefully', async() => {
    (StorageService.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'))

    await expect(fetchClient.loadIdToken()).rejects.toThrow(FetchClientError)
    await expect(fetchClient.loadIdToken()).rejects.toThrow('Storage error')
  })
})
