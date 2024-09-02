#!/bin/bash
set -e
redocly bundle $OPENAPI_FILE -o $MERGED_OPENAPI_FILE

checkAndUpdatePlaceholder() {
    local placeholder="$1"
    local value="$2"

    if [ -z "$value" ]; then
        echo "Error: Missing required variable: $placeholder" >&2
        exit 1
    fi

    sed -i "s/<<$placeholder>>/$value/g" "$MERGED_OPENAPI_FILE"
}

checkAndUpdatePlaceholder AWS_REGION "$AWS_REGION"
checkAndUpdatePlaceholder ACCOUNT_ID "$ACCOUNT_ID"
checkAndUpdatePlaceholder ENVIRONMENT "$ENVIRONMENT"
checkAndUpdatePlaceholder API_GATEWAY_ID "$API_GATEWAY_ID"
checkAndUpdatePlaceholder API_VERSION "$API_VERSION"
