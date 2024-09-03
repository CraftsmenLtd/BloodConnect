#!/bin/bash
set -e

# Set the base directory for OpenAPI paths
BASE_DIR="$OPENAPI_DIRECTORY/paths"

# Function to update integration references in the YAML file
updateIntegrationsFilesRef() {
    local file="$1" # The YAML file to process
    # Extract unique patterns of the form {{pattern}} from the file
    patterns=$(grep -o '{{[^}]*}}' "$file" | sort | uniq)

    if [ -n "$patterns" ]; then # Check if any patterns were found
        echo "Processing file: $file"

        for pattern in $patterns; do
            # Extract the filename from the pattern (removing `{{}}`)
            filename=$(echo "$pattern" | sed -e 's/{{\([^}]*\)}}/\1/')
            echo "Updating reference for file: $filename"

            # Replace the pattern with the appropriate $ref path
            sed -i "s/\"$pattern\"/\n    \$ref: .\/..\/..\/integration\/$CLOUD_PROVIDER\/auth\/$filename/g" "$file"
        done
    else
        echo "No patterns found in $file"
    fi
}

# Find and process each YAML file under the `paths` directory
find "$BASE_DIR" -name "*.yml" | while read -r file; do
    updateIntegrationsFilesRef "$file"
done

# Bundle the OpenAPI specification using Redocly and output to the merged file
redocly bundle "$OPENAPI_DIRECTORY/versions/$API_VERSION.yml" -o "$MERGED_OPENAPI_FILE"

# Function to check and update placeholders in the merged OpenAPI file
checkAndUpdatePlaceholder() {
    local placeholder="$1" # Placeholder to replace
    local value="$2"       # Value to replace the placeholder with

    if [ -z "$value" ]; then # If the value is empty, exit with an error
        echo "Error: Missing required variable: $placeholder" >&2
        exit 1
    fi

    # Replace the placeholder in the merged OpenAPI file
    sed -i "s/<<$placeholder>>/$value/g" "$MERGED_OPENAPI_FILE"
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
BASE64_ENCODED_OPENAPI=$(base64 "$MERGED_OPENAPI_FILE" | tr -d '\n')

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
