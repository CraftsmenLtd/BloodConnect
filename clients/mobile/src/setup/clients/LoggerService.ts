import { FetchClientError } from './FetchClientError'

export class LoggerService {
  private readonly baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  public async logError(error: unknown, header: Record<string, string>): Promise<void> {
    try {
      await fetch(`${this.baseURL}/logger`, {
        method: 'POST',
        headers: header,
        body: JSON.stringify({
          log: {
            message: error instanceof Error ? error.message.trim() : 'An unknown error occurred',
            status: error instanceof FetchClientError ? error.status : undefined
          }
        })
      })
    } catch (error) {
      console.error('Failed to log error')
    }
  }
}
