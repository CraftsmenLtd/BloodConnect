# Define environment variables
ENV_FILE=.env
APP_NAME=net.bloodconnect.app
EAS_CONFIG=eas.json

# Default build profile (can be overridden via CLI)
BUILD_PROFILE ?= development

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
	@echo "  upload-env        - Upload .env variables to Expo as Secret/Sensitive/Plain text."
	@echo "                      Example: make upload-env BUILD_PROFILE=production"

# Install required global dependencies
install-deps:
	@echo "Installing Expo CLI and EAS CLI globally..."
	npm install -g expo-cli eas-cli
	@echo "Installing project dependencies..."
	npm install

# Log in to the Expo account
login:
	@echo "Logging in to Expo account..."
	eas login

# Verify and set up environment variables
setup-env:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "$(ENV_FILE) not found! Please create it and define all required variables."; \
		exit 1; \
	fi
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
	rm -rf build .expo
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

delete-all-env:
	eas env:list $(BUILD_PROFILE) --format short --scope project | awk -F= 'NR>2 {print $$1}' | xargs -I {} eas env:delete $(BUILD_PROFILE) --variable-name {} --variable-environment $(BUILD_PROFILE) --scope project --non-interactive
