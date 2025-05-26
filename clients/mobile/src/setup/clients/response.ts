export type ApiResponse<T = undefined> = {
  success?: boolean;
  message?: string;
  status?: number;
  data?: T;
}
