export interface ApiResponse<T = undefined> {
  success?: boolean;
  message?: string;
  status?: number;
  data?: T;
}
