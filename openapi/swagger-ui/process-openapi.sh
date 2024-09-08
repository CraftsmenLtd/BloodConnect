#!/bin/bash

OPENAPI_FILE="/usr/share/nginx/html/openapi/versions/v1.json"

# Get the list of APIs from LocalStack API Gateway
API_GATEWAY_LIST=$(awslocal apigateway get-rest-apis --endpoint-url=$LOCALSTACK_ENDPOINT --region us-east-1)

# Extract the API ID for the API named 'localstack-api'
API_GATEWAY_ID=$(echo "$API_GATEWAY_LIST" | jq -r '.items[] | select(.name=="localstack-api") | .id')

if [ -z "$API_GATEWAY_ID" ]; then
  echo "API Gateway ID not found for 'localstack-api'"
  exit 1
fi

# Process the OpenAPI file to replace placeholders
sed -i "s/\${ENVIRONMENT}/${ENVIRONMENT}/g" "$OPENAPI_FILE"
sed -i "s/\${API_VERSION}/${API_VERSION}/g" "$OPENAPI_FILE"
sed -i "s/API_GATEWAY_ID/${API_GATEWAY_ID}/g" "$OPENAPI_FILE"
