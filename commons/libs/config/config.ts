type AllConfig = {
  passwordMinimumLength: number;
  logLevel: string;
  maxRetryCount: number;
  donorSearchQueueArn: string;
  maxGeohashPerProcessingBatch: number;
  googleMapsApiKey: string;
  country: string;
  minMonthsBetweenDonations: number;
  dynamodbTableName: string;
  awsRegion: string;
  emailSender: string;
  platformArnApns: string;
  platformArnFcm: string;
  notificationQueueUrl: string;
  donorSearchQueueUrl: string;
  maxGeohashCacheEntriesCount: number;
  maxGeohashCacheMbSize: number;
  maxGeohashCacheTimeoutMinutes: number;
  maxGeohashNeighborSearchLevel: number;
  neighborSearchGeohashPrefixLength: number;
  cacheGeohashPrefixLength: number;
  donorSearchMaxInitiatingRetryCount: number;
  donorSearchDelayBetweenExecution: number;
  maxGeohashesPerExecution: number;
}

type ConfigSubset<T> = { [K in keyof T]: K extends keyof AllConfig ? AllConfig[K] : never }

export class Config<T extends ConfigSubset<T>> {
  private config: AllConfig

  constructor() {
    this.config = {
      passwordMinimumLength:
        Number(process.env.PASSWORD_MINIMUM_LENGTH) as AllConfig['passwordMinimumLength'],
      logLevel: (process.env.LOG_LEVEL ?? 'info') as AllConfig['logLevel'],
      maxRetryCount: Number(process.env.MAX_RETRY_COUNT) as AllConfig['maxRetryCount'],
      donorSearchQueueArn: process.env.DONOR_SEARCH_QUEUE_ARN as AllConfig['donorSearchQueueArn'],
      maxGeohashPerProcessingBatch: Number(process.env.MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL) as
        AllConfig['maxGeohashPerProcessingBatch'],
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY as AllConfig['googleMapsApiKey'],
      country: (process.env.COUNTRY ?? 'BD') as AllConfig['country'],
      minMonthsBetweenDonations: Number(process.env.MIN_MONTHS_BETWEEN_DONATIONS) as
        AllConfig['minMonthsBetweenDonations'],
      dynamodbTableName: process.env.DYNAMODB_TABLE_NAME as AllConfig['dynamodbTableName'],
      awsRegion: process.env.AWS_REGION as AllConfig['awsRegion'],
      emailSender: process.env.EMAIL_SENDER as AllConfig['emailSender'],
      platformArnApns: process.env.PLATFORM_ARN_APNS as AllConfig['platformArnApns'],
      platformArnFcm: process.env.PLATFORM_ARN_FCM as AllConfig['platformArnFcm'],
      notificationQueueUrl: process.env.NOTIFICATION_QUEUE_URL as AllConfig['notificationQueueUrl'],
      donorSearchQueueUrl: process.env.DONOR_SEARCH_QUEUE_URL as AllConfig['donorSearchQueueUrl'],
      maxGeohashCacheEntriesCount: Number(process.env.MAX_GEOHASH_CACHE_ENTRIES_COUNT) as
        AllConfig['maxGeohashCacheEntriesCount'],
      maxGeohashCacheMbSize: Number(process.env.MAX_GEOHASH_CACHE_MB_SIZE) as
        AllConfig['maxGeohashCacheMbSize'],
      maxGeohashCacheTimeoutMinutes: Number(process.env.MAX_GEOHASH_CACHE_TIMEOUT_MINUTES) as
        AllConfig['maxGeohashCacheTimeoutMinutes'],
      maxGeohashNeighborSearchLevel: Number(process.env.MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL) as
        AllConfig['maxGeohashNeighborSearchLevel'],
      neighborSearchGeohashPrefixLength:
        Number(process.env.NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH) as
        AllConfig['neighborSearchGeohashPrefixLength'],
      cacheGeohashPrefixLength: Number(process.env.CACHE_GEOHASH_PREFIX_LENGTH) as
        AllConfig['cacheGeohashPrefixLength'],
      donorSearchMaxInitiatingRetryCount:
        Number(process.env.DONOR_SEARCH_MAX_INITIATING_RETRY_COUNT) as
        AllConfig['donorSearchMaxInitiatingRetryCount'],
      donorSearchDelayBetweenExecution: Number(process.env.DONOR_SEARCH_DELAY_BETWEEN_EXECUTION) as
        AllConfig['donorSearchDelayBetweenExecution'],
      maxGeohashesPerExecution: Number(process.env.MAX_GEOHASHES_PER_EXECUTION) as
        AllConfig['maxGeohashesPerExecution'],
    }
  }

  getConfig(): ConfigSubset<T> {
    return this.config as ConfigSubset<T>
  }

  overrideConfig(newConfig: T): void {
    this.config = { ...this.config, ...newConfig }
  }
}
