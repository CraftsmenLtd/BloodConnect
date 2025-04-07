import type { FetchResponse } from './FetchClient'

export type HttpClient = {
  get<T>(url: string, params?: Record<string, unknown>, headers?: Record<string, string>): Promise<T>;
  post<T>(url: string, body: Record<string, unknown>, headers?: Record<string, string>): Promise<FetchResponse<T>>;
  patch<T>(url: string, body: Record<string, unknown>, headers?: Record<string, string>): Promise<FetchResponse<T>>;
}
