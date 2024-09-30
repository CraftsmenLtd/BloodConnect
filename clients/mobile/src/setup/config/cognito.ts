import Constants from 'expo-constants'
const { AWS_USER_POOL_ID, AWS_USER_POOL_CLIENT_ID } = Constants.expoConfig?.extra ?? {}

export const awsCognitoConfiguration = {
  Auth: {
    Cognito: {
      userPoolId: AWS_USER_POOL_ID,
      userPoolClientId: AWS_USER_POOL_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: 'i-79-google-login-auth-domain.auth.ap-south-1.amazoncognito.com',
          scopes: ['email', 'profile', 'openid'],
          redirectSignIn: ['myapp://callback'],
          redirectSignOut: ['myapp://signout'],
          providers: ['Google'],
          responseType: 'code'
        }
      }
    }
  }
}
