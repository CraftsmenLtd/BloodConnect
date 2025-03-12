# Auto import env file
ifneq ("$(findstring mobile/, $(shell pwd))", "")
  ifneq ("$(wildcard .env)", "")
    include .env
    export
  endif
else
  ifneq ("$(wildcard clients/mobile/.env)", "")
    include clients/mobile/.env
    export
  endif
endif


# Default build profile (can be overridden via CLI)
BUILD_PROFILE?=development

install-native-packages:
	@npm install -g expo-cli eas-cli
	@npm install

# Build the APK with the specified profile
build-android:
	@eas build --profile $(BUILD_PROFILE) --platform android --non-interactive --no-wait

clean:
	@rm -rf build .expo

upload-env:
	@eas env:create --environment $(BUILD_PROFILE) --name APP_NAME --value $(APP_NAME) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name EAS_PROJECT_ID --value $(EAS_PROJECT_ID) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name APP_VERSION --value $(APP_VERSION) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name COUNTRY --value $(COUNTRY) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name AWS_USER_POOL_CLIENT_ID --value $(AWS_USER_POOL_CLIENT_ID) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name AWS_USER_POOL_ID --value $(AWS_USER_POOL_ID) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name API_BASE_URL --value $(API_BASE_URL) --type string --visibility plaintext --force --scope project --non-interactive
	@eas env:create --environment $(BUILD_PROFILE) --name AWS_COGNITO_DOMAIN --value $(AWS_COGNITO_DOMAIN) --type string --visibility plaintext --force --scope project --non-interactive
