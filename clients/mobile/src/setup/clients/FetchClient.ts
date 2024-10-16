import { HttpClient } from './HttpClient'

export class FetchClient implements HttpClient {
  async get<T>(url: string, params: Record<string, any> = {}, headers: Record<string, string> = {}): Promise<T> {
    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`${url}?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return (await response.json()) as T
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      throw new Error(`Failed to fetch data from ${url}: ${errorMessage}`)
    }
  }

  async post<T>(url: string, body: string, headers: Record<string, string> = {}): Promise<T> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      throw new Error(`Failed to post data to ${url}: ${errorMessage}`)
    }
  }
}
