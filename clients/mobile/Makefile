# Auto import env file
ENV_FILE:=clients/mobile/.env
ifneq ("$(findstring clients/mobile/, $(shell pwd))", "")
  ENV_FILE:=.env
endif

ifneq ("$(wildcard $(ENV_FILE))", "")
  include $(ENV_FILE)
  export
endif

DIR:=$(dir $(ENV_FILE))

# Default build profile (can be overridden via CLI)
BUILD_PROFILE?=development

install-native-packages:
	@npm install --prefix $(DIR)

install-binaries:
	@npm install -g expo-cli eas-cli

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
