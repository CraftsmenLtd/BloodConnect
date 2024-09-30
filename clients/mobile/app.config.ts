import 'dotenv/config'
import { ExpoConfig } from '@expo/config-types'

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const ENV = process.env.APP_ENV ?? 'development'

  const ENV_VARS: Record<string, { AWS_USER_POOL_ID?: string; AWS_USER_POOL_CLIENT_ID?: string }> = {
    development: {
      AWS_USER_POOL_ID: process.env.AWS_USER_POOL_ID,
      AWS_USER_POOL_CLIENT_ID: process.env.AWS_USER_POOL_CLIENT_ID
    }
  }

  return {
    ...config,
    extra: {
      ...ENV_VARS[ENV],
      eas: {
        projectId: '1e1bfd4b-b929-41d8-b8f1-0d08220ac021'
      }
    }
  }
}
