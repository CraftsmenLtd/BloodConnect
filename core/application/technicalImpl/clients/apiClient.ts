import { AxiosInstance } from 'axios'
export interface HttpClient {
  get<T>(url: string, params?: Record<string, any>): Promise<T>;
}

export class AxiosClient implements HttpClient {
  private readonly axiosInstance: AxiosInstance

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance
  }

  async get<T>(url: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(url, { params })
      return response.data
    } catch (error) {
      throw new Error(`Failed to fetch data from ${url}: ${error}`)
    }
  }
}
