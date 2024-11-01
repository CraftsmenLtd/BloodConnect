import { FetchResponse } from './FetchClient'

export interface HttpClient {
  get<T>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T>;
  post<T>(url: string, body: Record<string, any>, headers?: Record<string, string>): Promise<FetchResponse<T>>;
  patch<T>(url: string, body: Record<string, any>, headers?: Record<string, string>): Promise<FetchResponse<T>>;
}
