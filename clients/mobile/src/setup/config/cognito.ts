import Constants from 'expo-constants'
const { AWS_USER_POOL_ID, AWS_USER_POOL_CLIENT_ID } = Constants.expoConfig?.extra ?? {}

export const awsCognitoConfiguration = {
  Auth: {
    Cognito: {
      userPoolId: AWS_USER_POOL_ID,
      userPoolClientId: AWS_USER_POOL_CLIENT_ID
    }
  }
}
