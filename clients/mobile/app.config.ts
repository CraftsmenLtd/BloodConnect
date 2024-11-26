import 'dotenv/config'
import { ExpoConfig } from '@expo/config-types'

type EnvVars = {
  AWS_USER_POOL_ID: string;
  AWS_USER_POOL_CLIENT_ID: string;
  AWS_COGNITO_DOMAIN: string;
  EAS_PROJECT_ID: string;
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  LOCATION_SERVICE_EMAIL: string;
  GOOGLE_MAP_API_KEY: string;
  GOOGLE_MAP_API: string;
  OPEN_STREET_MAP_API: string;
  APP_ENV: string;
  COUNTRY: string;
}

const ensureEnvVars = (vars: Record<string, string | undefined>): EnvVars => {
  const missing = Object.entries(vars).filter(([, value]) => value === null || value === undefined || value === '')

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.map(([key]) => key).join(', ')}`
    )
  }
  return vars as EnvVars
}

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const ENV = process.env.APP_ENV ?? 'preview'

  const ENV_VARS: Record<string, EnvVars> = {
    development: ensureEnvVars({
      AWS_USER_POOL_ID: process.env.AWS_USER_POOL_ID,
      AWS_USER_POOL_CLIENT_ID: process.env.AWS_USER_POOL_CLIENT_ID,
      AWS_COGNITO_DOMAIN: process.env.AWS_COGNITO_DOMAIN,
      EAS_PROJECT_ID: process.env.EAS_PROJECT_ID,
      API_BASE_URL: process.env.API_BASE_URL,
      APP_NAME: process.env.APP_NAME,
      APP_VERSION: process.env.APP_VERSION,
      LOCATION_SERVICE_EMAIL: process.env.LOCATION_SERVICE_EMAIL,
      GOOGLE_MAP_API_KEY: process.env.GOOGLE_MAP_API_KEY,
      GOOGLE_MAP_API: process.env.GOOGLE_MAP_API,
      OPEN_STREET_MAP_API: process.env.OPEN_STREET_MAP_API,
      APP_ENV: process.env.APP_ENV,
      COUNTRY: process.env.COUNTRY
    }),
    preview: ensureEnvVars({
      AWS_USER_POOL_ID: process.env.AWS_USER_POOL_ID,
      AWS_USER_POOL_CLIENT_ID: process.env.AWS_USER_POOL_CLIENT_ID,
      AWS_COGNITO_DOMAIN: process.env.AWS_COGNITO_DOMAIN,
      EAS_PROJECT_ID: process.env.EAS_PROJECT_ID,
      API_BASE_URL: process.env.API_BASE_URL,
      APP_NAME: process.env.APP_NAME,
      APP_VERSION: process.env.APP_VERSION,
      LOCATION_SERVICE_EMAIL: process.env.LOCATION_SERVICE_EMAIL,
      GOOGLE_MAP_API_KEY: process.env.GOOGLE_MAP_API_KEY,
      GOOGLE_MAP_API: process.env.GOOGLE_MAP_API,
      OPEN_STREET_MAP_API: process.env.OPEN_STREET_MAP_API,
      APP_ENV: process.env.APP_ENV,
      COUNTRY: process.env.COUNTRY
    })
  }

  return {
    ...config,
    extra: {
      ...ENV_VARS[ENV],
      eas: {
        projectId: ENV_VARS[ENV].EAS_PROJECT_ID
      }
    }
  }
}
