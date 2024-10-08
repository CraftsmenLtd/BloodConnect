====================================
SSO (Google & Facebook) Setup Guide
====================================

This guide explains the necessary steps to configure **Google** and **Facebook** login for our React Native app using AWS Cognito and GitHub Actions.

Setting up Google OAuth
=======================
To use Google login, follow these steps:

1. Go to the `Google Cloud Console <https://console.cloud.google.com/>`_, and create a new project.
2. Navigate to **APIs & Services** -> **Credentials**.
3. Click **Create Credentials** and choose **OAuth Client ID**.
4. Set the **Authorized redirect URIs** to: 

   .. code-block:: text

      https://<AWS_COGNITO_DOMAIN>/oauth2/idpresponse

5. Copy the **Client ID** and **Client Secret**.
6. In your GitHub repository, go to **Settings** -> **Secrets and Variables** -> **Actions**.
7. Create the following secrets:

   .. code-block:: text

      GOOGLE_CLIENT_ID=<your-google-client-id>
      GOOGLE_CLIENT_SECRET=<your-google-client-secret>

8. These will be accessed in the GitHub Actions workflow as environment variables.

Setting up Facebook OAuth
=========================
Follow these steps to configure Facebook login:

1. Go to the `Facebook Developer Portal <https://developers.facebook.com/apps/>`_, log in with your Facebook account.
2. Create a new app and select **Integrate Facebook Login**.
3. Under **Facebook Login** -> **Settings**, add the following **Valid OAuth Redirect URI**:

   .. code-block:: text

      https://<AWS_COGNITO_DOMAIN>/oauth2/idpresponse

4. Copy the **App ID** and **App Secret**.
5. In your GitHub repository, go to **Settings** -> **Secrets and Variables** -> **Actions**.
6. Create the following secrets:

   .. code-block:: text

      FACEBOOK_CLIENT_ID=<your-facebook-app-id>
      FACEBOOK_CLIENT_SECRET=<your-facebook-app-secret>

7. These Google and Facebook credentials stored in GitHub secrets will be accessed in the GitHub Actions workflow as environment variables.

Running the App
===============
To run the app with Google and Facebook login integration:

1. Make sure the GitHub Secrets are properly set for `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, and `FACEBOOK_CLIENT_SECRET`.
2. Ensure that you have created a `.env` file in the root directory of the React Native project that contains all the necessary variables:

   .. code-block:: bash

      AWS_USER_POOL_ID=<your-user-pool-id>
      AWS_USER_POOL_CLIENT_ID=<your-user-pool-client-id>
      AWS_COGNITO_DOMAIN=<your-cognito-domain>
   
3. Run the following command to start the app:

   .. code-block:: bash

      npx expo start

⚠️ OAuth Sign-In Limitation in Expo Go
======================================
When using AWS Amplify (v6) for OAuth in your Expo project, please be aware:

**Expo Go** does not support the required OAuth native module `@aws-amplify/rtn-web-browser` or other native modules. To use federated sign-in (e.g., Google, Facebook), you must either eject to the bare workflow or create a native build. 

- Testing OAuth functionality is not possible within **Expo Go** due to its inability to handle platform-specific dependencies.
- You must test on a physical device or emulator (iOS or Android).
- Alternatively, you can generate an APK (for Android) or IPA (for iOS) file and manually install it on your device for testing purposes.
