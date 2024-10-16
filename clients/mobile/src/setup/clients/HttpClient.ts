export interface HttpClient {
  get<T>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T>;
  post<T>(url: string, data?: Record<string, any> | string, headers?: Record<string, string>): Promise<T>; // Accept headers
}
