import Constants from 'expo-constants'

const { AWS_USER_POOL_ID, AWS_USER_POOL_CLIENT_ID, AWS_COGNITO_DOMAIN } = Constants.expoConfig?.extra ?? {}

export const awsCognitoConfiguration = {
  Auth: {
    Cognito: {
      userPoolId: AWS_USER_POOL_ID,
      userPoolClientId: AWS_USER_POOL_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: AWS_COGNITO_DOMAIN,
          scopes: ['email', 'profile', 'openid'],
          redirectSignIn: ['bloodconnect://callback'],
          redirectSignOut: ['bloodconnect://signout'],
          responseType: 'token' as const,
          socialproviders: ['Google', 'Facebook']
        }
      }
    }
  }
}
