type AllConfig = {
  passwordMinimumLength: number;
  logLevel: string;
  maxRetryCount: number;
  googleMapsApiKey: string;
  country: string;
  minMonthsBetweenDonations: number;
  dynamodbTableName: string;
  awsRegion: string;
  emailSender: string;
  platformArnApns: string;
  platformArnFcm: string;
  notificationQueueUrl: string;
  donorSearchLambdaArn: string;
  schedulerRoleArn: string;

  // v2 donor search wave tunables
  maxCellsPerExecution: number;
  searchIntervalSeconds: number;
  initialWaveDelaySeconds: number;
  retryDelaySeconds: number;
  maxRetries: number;
  acceptanceWindowSeconds: number;
  maxSearchRadiusKm: number;
  parallelQueryConcurrency: number;

  // Public post feed
  feedMaxRadiusKm: number;
  feedDefaultRadiusKm: number;
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
      schedulerRoleArn: process.env.SCHEDULER_ROLE_ARN as AllConfig['schedulerRoleArn'],
      donorSearchLambdaArn: process.env.DONOR_SEARCH_LAMBDA_ARN as AllConfig['donorSearchLambdaArn'],

      maxCellsPerExecution:
        Number(process.env.MAX_CELLS_PER_EXECUTION) as AllConfig['maxCellsPerExecution'],
      searchIntervalSeconds:
        Number(process.env.SEARCH_INTERVAL_SECONDS) as AllConfig['searchIntervalSeconds'],
      initialWaveDelaySeconds:
        Number(process.env.INITIAL_WAVE_DELAY_SECONDS) as AllConfig['initialWaveDelaySeconds'],
      retryDelaySeconds:
        Number(process.env.RETRY_DELAY_SECONDS) as AllConfig['retryDelaySeconds'],
      maxRetries: Number(process.env.MAX_RETRIES) as AllConfig['maxRetries'],
      acceptanceWindowSeconds:
        Number(process.env.ACCEPTANCE_WINDOW_SECONDS) as AllConfig['acceptanceWindowSeconds'],
      maxSearchRadiusKm:
        Number(process.env.MAX_SEARCH_RADIUS_KM) as AllConfig['maxSearchRadiusKm'],
      parallelQueryConcurrency:
        Number(process.env.PARALLEL_QUERY_CONCURRENCY) as AllConfig['parallelQueryConcurrency'],

      feedMaxRadiusKm:
        Number(process.env.FEED_MAX_RADIUS_KM) as AllConfig['feedMaxRadiusKm'],
      feedDefaultRadiusKm:
        Number(process.env.FEED_DEFAULT_RADIUS_KM) as AllConfig['feedDefaultRadiusKm']
    }
  }

  getConfig(): ConfigSubset<T> {
    return this.config as ConfigSubset<T>
  }

  overrideConfig(newConfig: T): void {
    this.config = { ...this.config, ...newConfig }
  }
}
