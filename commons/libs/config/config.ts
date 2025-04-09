type AllConfig = {
  passwordMinimumLength: number;
  logLevel: string;
  maxRetryCount: number;
  donorSearchQueueArn: string;
  maxGeohashPerProcessingBatch: number;
  googleMapsApiKey: string;
  country: string;
  minMonthsBetweenDonations: number;
  maxGeohashLength: number;
  monitorDonationBucketName: string;
  maxGeohashStorage: number;
  dynamodbTableName: string;
  awsRegion: string;
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
  maxGeohashPrefixLength: number;
  monitorDonationBucketPrefix: string;
}

type ConfigSubset<T> = { [K in keyof T]: K extends keyof AllConfig ? AllConfig[K] : never }

export class Config<T extends ConfigSubset<T>> {
  private config: AllConfig

  constructor() {
    this.config = {
      passwordMinimumLength: Number(process.env.PASSWORD_MINIMUM_LENGTH) as AllConfig['passwordMinimumLength'],
      logLevel: (process.env.LOG_LEVEL ?? 'info') as AllConfig['logLevel'],
      maxRetryCount: Number(process.env.MAX_RETRY_COUNT) as AllConfig['maxRetryCount'],
      donorSearchQueueArn: process.env.DONOR_SEARCH_QUEUE_ARN as AllConfig['donorSearchQueueArn'],
      maxGeohashPerProcessingBatch: Number(process.env.MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL) as AllConfig['maxGeohashPerProcessingBatch'],
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY as AllConfig['googleMapsApiKey'],
      country: (process.env.COUNTRY ?? 'BD') as AllConfig['country'],
      minMonthsBetweenDonations: Number(process.env.MIN_MONTHS_BETWEEN_DONATIONS) as AllConfig['minMonthsBetweenDonations'],
      maxGeohashLength: Number(process.env.MAX_GEOHASH_LENGTH) as AllConfig['maxGeohashLength'],
      monitorDonationBucketName: process.env.MONITOR_DONATION_BUCKET_NAME as AllConfig['monitorDonationBucketName'],
      maxGeohashStorage: Number(process.env.MAX_GEOHASH_STORAGE) as AllConfig['maxGeohashStorage'],
      dynamodbTableName: process.env.DYNAMODB_TABLE_NAME as AllConfig['dynamodbTableName'],
      awsRegion: process.env.AWS_REGION as AllConfig['awsRegion'],
      emailSender: process.env.EMAIL_SENDER as AllConfig['emailSender'],
      platformArnApns: process.env.PLATFORM_ARN_APNS as AllConfig['platformArnApns'],
      platformArnFcm: process.env.PLATFORM_ARN_FCM as AllConfig['platformArnFcm'],
      notificationQueueUrl: process.env.NOTIFICATION_QUEUE_URL as AllConfig['notificationQueueUrl'],
      maxGeohashCacheEntriesCount: process.env.MAX_GEOHASH_CACHE_ENTRIES_COUNT as AllConfig['maxGeohashCacheEntriesCount'],
      maxGeohashCacheMbSize: process.env.MAX_GEOHASH_CACHE_MB_SIZE as AllConfig['maxGeohashCacheMbSize'],
      maxGeohashCacheTimeoutMinutes: process.env.MAX_GEOHASH_CACHE_TIMEOUT_MINUTES as AllConfig['maxGeohashCacheTimeoutMinutes'],
      maxGeohashNeighborSearchLevel: process.env.MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL as AllConfig['maxGeohashNeighborSearchLevel'],
      neighborSearchGeohashPrefixLength: process.env.NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH as AllConfig['neighborSearchGeohashPrefixLength'],
      cacheGeohashPrefixLength: process.env.CACHE_GEOHASH_PREFIX_LENGTH as AllConfig['cacheGeohashPrefixLength'],
      maxGeohashPrefixLength: Number(process.env.MAX_GEOHASH_PREFIX_LENGTH) as AllConfig['maxGeohashPrefixLength'],
      monitorDonationBucketPrefix: process.env.MONITOR_DONATION_BUCKET_PREFIX as AllConfig['monitorDonationBucketPrefix'],
    }
  }

  getConfig(): ConfigSubset<T> {
    return this.config as ConfigSubset<T>
  }

  overrideConfig(newConfig: T): void {
    this.config = { ...this.config, ...newConfig }
  }
}
