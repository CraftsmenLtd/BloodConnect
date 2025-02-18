export type ConfigType = {
  passwordMinimumLength: number;
  logLevel: string;
  maxRetryCount: number;
  donorSearchQueueArn: string;
  maxGeohashPerProcessingBatch: number;
  googleMapsApiKey: string;
  country: string;
  minMonthsBetweenDonations: number;
  maxGeohashLength: number;
  bucketName: string;
  maxGeohashStorage: number;
  dynamodbTableName: string;
  emailSender: string;
  platformArnApns: string;
  platformArnFcm: string;
  notificationQueueUrl: string;
  maxGeohashCacheEntriesCount: string;
  maxGeohashCacheMbSize: string;
  maxGeohashCacheTimeoutMinutes: string;
  maxGeohashNeighborSearchLevel: string;
  neighborSearchGeohashPrefixLength: string;
  cacheGeohashPrefixLength: string;
}

export class Config {
  private config

  constructor() {
    this.config = {
      passwordMinimumLength: Number(process.env.PASSWORD_MINIMUM_LENGTH),
      logLevel: process.env.LOG_LEVEL ?? 'info' as string,
      maxRetryCount: Number(process.env.MAX_RETRY_COUNT),
      donorSearchQueueArn: process.env.DONOR_SEARCH_QUEUE_ARN as string,
      maxGeohashPerProcessingBatch: Number(process.env.MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL),
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY as string,
      country: process.env.COUNTRY ?? 'BD' as string,
      minMonthsBetweenDonations: Number(process.env.MIN_MONTHS_BETWEEN_DONATIONS),
      maxGeohashLength: Number(process.env.MAX_GEOHASH_LENGTH),
      bucketName: process.env.BUCKET_NAME as string,
      maxGeohashStorage: Number(process.env.MAX_GEOHASH_STORAGE),
      dynamodbTableName: process.env.DYNAMODB_TABLE_NAME as string,
      emailSender: process.env.EMAIL_SENDER as string,
      platformArnApns: process.env.PLATFORM_ARN_APNS as string,
      platformArnFcm: process.env.PLATFORM_ARN_FCM as string,
      notificationQueueUrl: process.env.NOTIFICATION_QUEUE_URL as string,
      maxGeohashCacheEntriesCount: process.env.MAX_GEOHASH_CACHE_ENTRIES_COUNT as string,
      maxGeohashCacheMbSize: process.env.MAX_GEOHASH_CACHE_MB_SIZE as string,
      maxGeohashCacheTimeoutMinutes: process.env.MAX_GEOHASH_CACHE_TIMEOUT_MINUTES as string,
      maxGeohashNeighborSearchLevel: process.env.MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL as string,
      neighborSearchGeohashPrefixLength: process.env.NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH as string,
      cacheGeohashPrefixLength: process.env.CACHE_GEOHASH_PREFIX_LENGTH as string
    }
  }

  getConfig(): ConfigType {
    return this.config
  }

  overrideConfig(newConfig: ConfigType): void {
    this.config = { ...this.config, ...newConfig }
  }
}
