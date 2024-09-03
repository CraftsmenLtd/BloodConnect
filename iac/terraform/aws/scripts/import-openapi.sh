#!/bin/bash
set -e

# Bundle the OpenAPI specification using Redocly and output to the merged file
redocly bundle "$OPENAPI_DIRECTORY/versions/$API_VERSION.yml" -o "$COMBINED_OPENAPI_FILE"

# Function to check and update placeholders in the merged OpenAPI file
checkAndUpdatePlaceholder() {
    local placeholder="$1" # Placeholder to replace
    local value="$2"       # Value to replace the placeholder with

    if [ -z "$value" ]; then # If the value is empty, exit with an error
        echo "Error: Missing required variable: $placeholder" >&2
        exit 1
    fi

    # Replace the placeholder in the merged OpenAPI file
    sed -i "s/<<$placeholder>>/$value/g" "$COMBINED_OPENAPI_FILE"
}

# Update placeholders in the merged OpenAPI file with actual values
checkAndUpdatePlaceholder "AWS_REGION" "$AWS_REGION"
checkAndUpdatePlaceholder "ACCOUNT_ID" "$ACCOUNT_ID"
checkAndUpdatePlaceholder "ENVIRONMENT" "$ENVIRONMENT"
checkAndUpdatePlaceholder "API_GATEWAY_ID" "$API_GATEWAY_ID"
checkAndUpdatePlaceholder "API_VERSION" "$API_VERSION"

# Determine which AWS runner to use (awslocal for localstack or aws for production)
if [ "$ENVIRONMENT" = "localstack" ]; then
    AWS_RUNNER=awslocal
else
    AWS_RUNNER=aws
fi

# Base64 encode the merged OpenAPI file
BASE64_ENCODED_OPENAPI=$(base64 "$COMBINED_OPENAPI_FILE" | tr -d '\n')

# Update the API Gateway with the new OpenAPI specification
$AWS_RUNNER apigateway put-rest-api \
    --rest-api-id "$API_GATEWAY_ID" \
    --body "$BASE64_ENCODED_OPENAPI" \
    --region "$AWS_REGION" \
    --mode "overwrite"

# Deploy the updated API to the specified stage
$AWS_RUNNER apigateway create-deployment \
    --rest-api-id "$API_GATEWAY_ID" \
    --stage-name "$ENVIRONMENT"
