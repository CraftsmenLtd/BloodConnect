import 'dotenv/config'

export default ({ config }) => {
  const ENV = process.env.APP_ENV ?? 'development'

  const ENV_VARS = {
    development: {
      AWS_USER_POOL_ID: process.env.AWS_USER_POOL_ID,
      AWS_USER_POOL_CLIENT_ID: process.env.AWS_USER_POOL_CLIENT_ID
    }
  }

  return {
    ...config,
    extra: {
      ...ENV_VARS[ENV]
    }
  }
}
