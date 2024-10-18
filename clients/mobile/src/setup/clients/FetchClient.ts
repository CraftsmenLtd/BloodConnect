import { HttpClient } from './HttpClient'
import { FetchClientError } from './FetchClientError'
import StorageService from '../../utility/storageService'
import authService from '../../authentication/authService'

export interface FetchResponse<T> {
  data: T;
  status: number;
}

export class FetchClient implements HttpClient {
  private idToken: string | null = null
  private readonly baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
    void this.loadIdToken()
  }

  public async loadIdToken(): Promise<string | null> {
    return await StorageService.getItem('idToken')
  }

  public async setupRequestHeaders(headers: Record<string, string>): Promise<Record<string, string>> {
    if (this.idToken === null) {
      this.idToken = await this.loadIdToken()
    }

    const payload = authService.decodeAccessToken(this.idToken)

    if (this.idToken !== null && payload.exp !== undefined && payload.exp < Math.floor(Date.now() / 1000)) {
      const { idToken } = await authService.fetchSession()
      this.idToken = idToken
    }
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    }

    if (this.idToken !== null) {
      requestHeaders.Authorization = `Bearer ${this.idToken}`
    }

    return requestHeaders
  }

  async get<T>(url: string, params: Record<string, any> = {}, headers: Record<string, string> = {}): Promise<T> {
    const queryString = new URLSearchParams(params).toString()
    const response = await this.fetchWithAuth<T>(`${url}?${queryString}`, 'GET', null, headers)

    return response.data
  }

  async post<T>(url: string, body: Record<string, any>, headers: Record<string, string> = {}): Promise<FetchResponse<T>> {
    return await this.fetchWithAuth<T>(url, 'POST', JSON.stringify(body), headers)
  }

  public async fetchWithAuth<T>(url: string, method: string, body: string | null, headers: Record<string, string>): Promise<FetchResponse<T>> {
    try {
      const requestHeaders = await this.setupRequestHeaders(headers)
      const fullUrl = `${this.baseURL}${url}`
      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new FetchClientError(`${errorText}`, response.status)
      }

      return {
        data: await response.json(),
        status: response.status
      }
    } catch (error) {
      if (error instanceof FetchClientError) {
        throw error
      }

      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      const status = (error as { status?: number }).status ?? 500
      throw new FetchClientError(errorMessage, status)
    }
  }
}
