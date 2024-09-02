#!/bin/bash
set -e

if [ "$ENVIRONMENT" = "localstack" ]; then
    AWS_RUNNER=awslocal
else
    AWS_RUNNER=aws
fi

BASE64_ENCODED_OPENAPI=$(base64 $MERGED_OPENAPI_FILE | tr -d '\n')

$AWS_RUNNER apigateway put-rest-api \
    --rest-api-id $API_GATEWAY_ID \
    --body $BASE64_ENCODED_OPENAPI \
    --region $AWS_REGION \
    --mode "overwrite"

$AWS_RUNNER apigateway create-deployment \
    --rest-api-id $API_GATEWAY_ID \
    --stage-name $ENVIRONMENT
