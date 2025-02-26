export interface IMonitoringService {
  log(message: string): void;
  recordError(error: Error): void;
  setUserId(userId: string): void;
  setAttributes(attributes: Record<string, string>): void;
  crash(): void;
}
