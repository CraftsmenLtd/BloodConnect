#!/bin/bash

OPENAPI_FILE="/usr/share/nginx/html/openapi/versions/v1.json"
sed -i "s/API_GATEWAY_ID/${API_GATEWAY_ID}/g" "$OPENAPI_FILE"
sed -i "s/BRANCH_NAME/${BRANCH_NAME}/g" "$OPENAPI_FILE"
