import type { HttpClient } from './HttpClient'
import { FetchClientError } from './FetchClientError'
import StorageService from '../../utility/storageService'
import authService from '../../authentication/services/authService'

export type FetchResponse<T> = T & { status: number }

const HTTP_UNAUTHORIZED = 401

export class FetchClient implements HttpClient {
  private idToken: string | null = null
  private readonly baseURL: string
  private readonly logoutUser?: () => Promise<void>

  constructor (baseURL: string, logoutUser?: () => Promise<void>) {
    this.baseURL = baseURL
    this.logoutUser = logoutUser
    void this.loadIdToken()
  }

  public async loadIdToken (): Promise<void> {
    this.idToken = await StorageService.getItem('idToken')
  }

  public async setupRequestHeaders (headers: Record<string, string>): Promise<Record<string, string>> {
    const requestHeaders: Record<string, string> = { 'Content-Type': 'application/json', ...headers }
    const { idToken } = await authService.fetchSession()
    requestHeaders.Authorization = `Bearer ${idToken}`
    return requestHeaders
  }

  async get<T>(url: string, params: Record<string, unknown> = {}, headers: Record<string, string> = {}): Promise<FetchResponse<T>> {
    const queryString = new URLSearchParams(params).toString()
    return this.fetchWithAuth<T>(`${url}?${queryString}`, 'GET', null, headers)
  }

  async post<T>(url: string, body: Record<string, unknown>, headers: Record<string, string> = {}): Promise<FetchResponse<T>> {
    return this.fetchWithAuth<T>(url, 'POST', JSON.stringify(body), headers)
  }

  async patch<T>(url: string, body: Record<string, unknown>, headers: Record<string, string> = {}): Promise<FetchResponse<T>> {
    return this.fetchWithAuth<T>(url, 'PATCH', JSON.stringify(body), headers)
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
        throw new FetchClientError(errorText, response.status)
      }

      const responseData = await response.json() as T
      return { ...responseData, status: response.status }
    } catch (error) {
      if (this.logoutUser !== undefined && error.status === HTTP_UNAUTHORIZED) {
        await this.logoutUser()
      }
      const status = error instanceof FetchClientError ? error.status : 500
      const message = error instanceof Error ? error.message : 'An unknown error occurred'
      throw new FetchClientError(message, status)
    }
  }
}
