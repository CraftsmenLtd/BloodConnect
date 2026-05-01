import { FetchClient } from '../../../src/setup/clients/FetchClient'
import { FetchClientError } from '../../../src/setup/clients/FetchClientError'
import authService from '../../../src/authentication/services/authService'

jest.mock('../../../src/authentication/services/authService')

describe('FetchClient', () => {
  const baseURL = 'https://api.example.com'
  const fetchClient = new FetchClient(baseURL)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize with baseURL', () => {
    expect(fetchClient).toBeDefined()
  })

  test('should setup request headers with idToken from auth session', async() => {
    (authService.fetchSession as jest.Mock).mockResolvedValue({ idToken: 'mockIdToken' })

    const headers = await fetchClient.setupRequestHeaders({})
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer mockIdToken'
    })
  })

  test('should fetch a fresh session for every request', async() => {
    (authService.fetchSession as jest.Mock).mockResolvedValue({ idToken: 'newIdToken' })

    const headers = await fetchClient.setupRequestHeaders({})
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer newIdToken'
    })
    expect(authService.fetchSession).toHaveBeenCalled()
  })

  test('should perform a GET request', async() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ key: 'value' })
    })

    const response = await fetchClient.get('/endpoint', { key: 'value' })
    expect(response).toEqual({ key: 'value', status: 200 })
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
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({ key: 'value' })
    })

    const response = await fetchClient.post('/endpoint', { key: 'value' })
    expect(response).toEqual({ key: 'value', status: 201 })
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

})
