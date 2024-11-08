import 'dotenv/config'
import { ExpoConfig } from '@expo/config-types'

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const ENV = process.env.APP_ENV ?? 'development'

  const ENV_VARS: Record<string, {
    AWS_USER_POOL_ID?: string;
    AWS_USER_POOL_CLIENT_ID?: string;
    AWS_COGNITO_DOMAIN?: string;
    EAS_PROJECT_ID?: string;
    API_BASE_URL?: string;
    APP_NAME?: string;
    APP_VERSION?: string;
    LOCATION_SERVICE_EMAIL?: string;
  }> = {
    development: {
      AWS_USER_POOL_ID: process.env.AWS_USER_POOL_ID,
      AWS_USER_POOL_CLIENT_ID: process.env.AWS_USER_POOL_CLIENT_ID,
      AWS_COGNITO_DOMAIN: process.env.AWS_COGNITO_DOMAIN,
      EAS_PROJECT_ID: process.env.EAS_PROJECT_ID,
      API_BASE_URL: process.env.API_BASE_URL,
      APP_NAME: process.env.APP_NAME,
      APP_VERSION: process.env.APP_VERSION,
      LOCATION_SERVICE_EMAIL: process.env.LOCATION_SERVICE_EMAIL
    },
    preview: {
      AWS_USER_POOL_ID: process.env.AWS_USER_POOL_ID,
      AWS_USER_POOL_CLIENT_ID: process.env.AWS_USER_POOL_CLIENT_ID,
      AWS_COGNITO_DOMAIN: process.env.AWS_COGNITO_DOMAIN,
      EAS_PROJECT_ID: process.env.EAS_PROJECT_ID,
      API_BASE_URL: process.env.API_BASE_URL,
      APP_NAME: process.env.APP_NAME,
      APP_VERSION: process.env.APP_VERSION,
      LOCATION_SERVICE_EMAIL: process.env.LOCATION_SERVICE_EMAIL
    }
  }

  return {
    ...config,
    extra: {
      ...ENV_VARS[ENV],
      eas: {
        projectId: 'PROJECT ID'
      }
    }
  }
}
