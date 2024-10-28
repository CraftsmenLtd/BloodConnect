#!/bin/bash

BRANCH_NAME=$1
EMAIL=$2
PASSWORD=$3
REGION="ap-south-1"

API_GATEWAY_ID=$(aws apigateway get-rest-apis --query "items[?starts_with(name, '$BRANCH_NAME')].id" --output text --region $REGION)
USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 --query "UserPools[?starts_with(Name, '$BRANCH_NAME')].Id" --output text --region $REGION)
APP_CLIENT_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id $USER_POOL_ID --query "UserPoolClients[0].ClientId" --output text --region $REGION)
EXISTING_USER=$(aws cognito-idp admin-get-user --user-pool-id $USER_POOL_ID --username $EMAIL --region $REGION 2>&1)

if [[ $EXISTING_USER == *"UserNotFoundException"* ]]; then
    aws cognito-idp sign-up \
    --client-id $APP_CLIENT_ID \
    --username $EMAIL \
    --password $PASSWORD \
    --region $REGION \
    --user-attributes Name=email,Value=$EMAIL Name=name,Value="$EMAIL"

    aws cognito-idp admin-confirm-sign-up \
    --user-pool-id $USER_POOL_ID \
    --username $EMAIL \
    --region $REGION
fi

AUTH_RESULT=$(aws cognito-idp initiate-auth \
    --auth-flow USER_PASSWORD_AUTH \
    --client-id $APP_CLIENT_ID \
    --auth-parameters USERNAME=$EMAIL,PASSWORD=$PASSWORD \
    --region $REGION)

ID_TOKEN=$(echo $AUTH_RESULT | jq -r '.AuthenticationResult.IdToken')
if [[ $ID_TOKEN == "null" ]]; then
    echo "Failed to retrieve ID token."
    exit 1
fi

echo "Writing to .env file..."
echo "API_GATEWAY_ID=$API_GATEWAY_ID" > ./openapi/swagger-ui/.env
echo "ID_TOKEN=$ID_TOKEN" >> ./openapi/swagger-ui/.env