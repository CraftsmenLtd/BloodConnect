#!/bin/bash

REGION=us-east-1
USERNAME=testuser@example.com
PASSWORD=P@ssw0rd123456

# Get User Pool ID and Client ID
USER_POOL_ID=$(awslocal cognito-idp list-user-pools --max-results 10 --region $REGION --endpoint-url=$LOCALSTACK_ENDPOINT | jq -r '.UserPools[] | select(.Name | contains("localstack")) | .Id')
CLIENT_ID=$(awslocal cognito-idp list-user-pool-clients --user-pool-id $USER_POOL_ID --region $REGION --endpoint-url=$LOCALSTACK_ENDPOINT | jq -r '.UserPoolClients[] | select(.ClientName | contains("localstack")) | .ClientId')

# Create Cognito User
awslocal cognito-idp admin-create-user --user-pool-id $USER_POOL_ID --username $USERNAME --temporary-password $PASSWORD --region $REGION --endpoint-url=$LOCALSTACK_ENDPOINT
awslocal cognito-idp admin-set-user-password --user-pool-id $USER_POOL_ID --username $USERNAME --password $PASSWORD --region $REGION --endpoint-url=$LOCALSTACK_ENDPOINT

# Authenticate User and Retrieve ID Token
ID_TOKEN=$(awslocal cognito-idp admin-initiate-auth --user-pool-id $USER_POOL_ID --client-id $CLIENT_ID --auth-flow ADMIN_NO_SRP_AUTH --auth-parameters USERNAME=$USERNAME,PASSWORD=$PASSWORD --region $REGION --endpoint-url=$LOCALSTACK_ENDPOINT | jq -r '.AuthenticationResult.IdToken')

# Update index.html with the ID token
if [ -n $ID_TOKEN ]; then
  echo Retrieved ID token: $ID_TOKEN
  sed -i "s/ID_TOKEN_VALUE/${ID_TOKEN}/g" "/usr/share/nginx/html/index.html"
else
  echo Failed to retrieve ID token >&2
  exit 1
fi

# Start NGINX
nginx -g 'daemon off;'
