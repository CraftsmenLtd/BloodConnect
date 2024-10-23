export interface ThrottlingRepository {
  getDailyRequestCount(seekerId: string, datePrefix: string): Promise<number>;
}
