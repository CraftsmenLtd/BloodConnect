# Auto import env file
ifneq ("$(wildcard .env)","")
  include .env
  export
endif

# Default build profile (can be overridden via CLI)
BUILD_PROFILE?=development
EAS_CONFIG=eas.json


# Define default targets
.PHONY: help install-deps login setup-env configure build clean

# Display help information
help:
	@echo "Usage: make [target] [BUILD_PROFILE=profile]"
	@echo ""
	@echo "Targets:"
	@echo "  install-deps      - Install Expo CLI, EAS CLI, and project dependencies(one-time operation)."
	@echo "  login             - Log in to your Expo account using EAS CLI."
	@echo "  setup-env         - Ensure the .env file exists and contains required variables."
	@echo "  configure         - Run EAS build configuration to create eas.json."
	@echo "  build             - Create an APK build with the specified profile (default: development)."
	@echo "                      Example: make build BUILD_PROFILE=production"
	@echo "  clean             - Clean up local build artifacts."
	@echo "  upload-env        - Upload .env variables to Expo as Secret/plaintext/Plain text."
	@echo "                      Example: make upload-env BUILD_PROFILE=production"

# Install required global dependencies
install-deps:
	@npm install -g expo-cli eas-cli
	@npm install

# Log in to the Expo account
login:
	@eas login

# Build the APK with the specified profile
build-android:
	@eas build --profile $(BUILD_PROFILE) --platform android

# Clean up local build artifacts
clean:
	@rm -rf build .expo

# Upload .env variables to Expo environment
upload-env:
	@eas env:create --environment $(BUILD_PROFILE) --name APP_NAME --value $(APP_NAME) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name EAS_PROJECT_ID --value $(EAS_PROJECT_ID) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name APP_VERSION --value $(APP_VERSION) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name COUNTRY --value $(COUNTRY) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name AWS_USER_POOL_CLIENT_ID --value $(AWS_USER_POOL_CLIENT_ID) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name AWS_USER_POOL_ID --value $(AWS_USER_POOL_ID) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name API_BASE_URL --value $(API_BASE_URL) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name AWS_COGNITO_DOMAIN --value $(AWS_COGNITO_DOMAIN) --type string --visibility plaintext --force --scope project --non-interactive
