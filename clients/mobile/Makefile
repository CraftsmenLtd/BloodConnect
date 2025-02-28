# Define environment variables
ENV_FILE=.env
APP_NAME=net.bloodconnect.app
EAS_CONFIG=eas.json
SHELL := /bin/bash

# Default build profile and branch (can be overridden via CLI)
BUILD_PROFILE ?= development
BRANCH_NAME ?= stage

# Define default targets
.PHONY: help install-deps login setup-env fetch-aws-details create-env configure build clean upload-env

# Display help information
help:
	@echo "Usage: make [target] [BUILD_PROFILE=profile] [BRANCH_NAME=branch]"
	@echo ""
	@echo "Targets:"
	@echo "  install-deps      - Install project dependencies."
	@echo "  login             - Log in to your Expo account using EAS CLI."
	@echo "  fetch-aws-details - Fetch AWS Cognito and API Gateway details."
	@echo "  create-env        - Create .env file with AWS and app details."
	@echo "  setup-env         - Ensure the .env file exists and contains required variables."
	@echo "  configure         - Run EAS build configuration to create eas.json."
	@echo "  build             - Create an APK build with the specified profile."
	@echo "  clean             - Clean up local build artifacts."
	@echo "  upload-env        - Upload .env variables to Expo."

# Install required dependencies
install-deps:
	@echo "Installing project dependencies..."
	npm install

# Log in to the Expo account
login:
	@echo "Logging in to Expo account..."
	eas login

# Fetch AWS Cognito and API Gateway details
fetch-aws-details:
	@echo "Fetching AWS details for branch: $(BRANCH_NAME)..."
	@SANITIZED_BRANCH=$(echo "${BRANCH_NAME}" | sed 's/[^a-zA-Z0-9-]//g' | awk '{print tolower($0)}') \
	USER_POOL_ID=$$(aws cognito-idp list-user-pools --max-results 20 | jq -r --arg name "$$SANITIZED_BRANCH-user-pool" '.UserPools[] | select(.Name==$$name) | .Id'); \
	echo USER_POOL_ID
	CLIENT_ID=$$(aws cognito-idp list-user-pool-clients --user-pool-id "$$USER_POOL_ID" --max-results 20 | jq -r --arg name "$$SANITIZED_BRANCH-app-pool-client" '.UserPoolClients[] | select(.ClientName==$$name) | .ClientId'); \
	COGNITO_DOMAIN=$$(aws cognito-idp describe-user-pool --user-pool-id "$$USER_POOL_ID" | jq -r '.UserPool.CustomDomain'); \
	# API_ID=$$(aws apigateway get-rest-apis | jq -r --arg name "$$SANITIZED_BRANCH-api" '.items[] | select(.name==$$name) | .id'); \
	# API_GATEWAY_URL="https://$$API_ID.execute-api.ap-south-1.amazonaws.com/api"; \
	if [ "$(BRANCH_NAME)" = "production" ]; then \
		echo "Setting API_BASE_URL for production..."; \
		API_BASE_URL="https://bloodconnect.net"; \
	elif [ "$(BRANCH_NAME)" = "master" ]; then \
		echo "Setting API_BASE_URL for master..."; \
		API_BASE_URL="https://stage.bloodconnect.net"; \
	else \
		echo "Setting API_BASE_URL for branch $$SANITIZED_BRANCH..."; \
		API_BASE_URL="https://$$SANITIZED_BRANCH.bloodconnect.net"; \
	fi; \
	echo "USER_POOL_ID=$$USER_POOL_ID" > $(ENV_FILE).tmp; \
	echo "CLIENT_ID=$$CLIENT_ID" >> $(ENV_FILE).tmp; \
	echo "COGNITO_DOMAIN=$$COGNITO_DOMAIN" >> $(ENV_FILE).tmp; \
	# echo "API_GATEWAY_URL=$$API_GATEWAY_URL" >> $(ENV_FILE).tmp; \
	echo "API_BASE_URL=$$API_BASE_URL" >> $(ENV_FILE).tmp

# Create .env file
create-env: fetch-aws-details
	@echo "Creating $(ENV_FILE)..."
	@if [ -f $(ENV_FILE).tmp ]; then \
		cat $(ENV_FILE).tmp > $(ENV_FILE); \
		rm -f $(ENV_FILE).tmp; \
	else \
		echo "Temporary file $(ENV_FILE).tmp not found!"; \
		exit 1; \
	fi; \
	echo "EAS_PROJECT_ID=a0b97362-72f9-428f-a2da-d16445c6193b" >> $(ENV_FILE); \
	echo "AWS_USER_POOL_ID=$$(grep USER_POOL_ID $(ENV_FILE) | cut -d= -f2)" >> $(ENV_FILE); \
	echo "AWS_USER_POOL_CLIENT_ID=$$(grep CLIENT_ID $(ENV_FILE) | cut -d= -f2)" >> $(ENV_FILE); \
	echo "AWS_COGNITO_DOMAIN=$$(grep COGNITO_DOMAIN $(ENV_FILE) | cut -d= -f2)" >> $(ENV_FILE); \
	echo "API_BASE_URL=$$(grep API_BASE_URL $(ENV_FILE) | cut -d= -f2)" >> $(ENV_FILE); \
	echo "APP_NAME=$(APP_NAME)" >> $(ENV_FILE); \
	echo "APP_VERSION=1.0.0" >> $(ENV_FILE); \
	echo "COUNTRY=BD" >> $(ENV_FILE)

# Verify and set up environment variables
setup-env: create-env
	@echo "Using environment variables from $(ENV_FILE)."

# Configure the project for EAS Build
configure:
	@echo "Running EAS Build configuration..."
	eas build:configure

# Build the APK with the specified profile
build:
	@echo "Building the APK with profile: $(BUILD_PROFILE)..."
	eas build --profile $(BUILD_PROFILE) --platform android

# Clean up local build artifacts
clean:
	@echo "Cleaning up build artifacts..."
	rm -rf build .expo $(ENV_FILE) $(ENV_FILE).tmp
	@echo "Clean up complete."

# Upload .env variables to Expo environment
upload-env:
	@echo "Uploading .env variables to Expo environment $(BUILD_PROFILE)..."
	@while IFS= read -r line || [ -n "$$line" ]; do \
		if [ ! -z "$$line" ] && [ "$${line:0:1}" != "#" ]; then \
			if echo "$$line" | grep -q "# Secrets"; then \
				visibility="secret"; \
			elif echo "$$line" | grep -q "# Sensitive"; then \
				visibility="sensitive"; \
			else \
				visibility="plaintext"; \
			fi; \
			key=$$(echo "$$line" | cut -d= -f1 | sed 's/#.*//'); \
			value=$$(echo "$$line" | cut -d= -f2- | sed 's/#.*//'); \
			echo "Uploading $$key as $$visibility..."; \
			eas env:create --environment $(BUILD_PROFILE) --name $$key --value "$$value" --type string --visibility $$visibility --force --scope project --non-interactive; \
		fi; \
	done < $(ENV_FILE)
	@echo "All environment variables uploaded."