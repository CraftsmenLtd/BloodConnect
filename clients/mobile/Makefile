# Auto import env file
MAKEFILE_DIR := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))
ENV_FILE := $(MAKEFILE_DIR).env

ifneq ("$(wildcard $(ENV_FILE))", "")
  include $(ENV_FILE)
  export
endif

# Default build profile (can be overridden via CLI)
BUILD_PROFILE?=development
APP_NAME?=net.bloodconnect.app
APP_VERSION?=1.1.2
export ANDROID_HOME?=/opt/android-sdk
export GRADLE_OPTS="-Djava.net.preferIPv4Stack=true"

build-android:
	@cd $(MAKEFILE_DIR) && eas build --profile $(BUILD_PROFILE) --platform android --non-interactive --no-wait

start-expo:
	@npm start --prefix $(MAKEFILE_DIR)

# Build the APK with the specified profile
build-android-local:
	@cd $(MAKEFILE_DIR) && CI=FALSE eas build --profile $(BUILD_PROFILE) --platform android --local --output "$(APP_NAME)_$(APP_VERSION)$(if $(filter production,$(BUILD_PROFILE)),.aab,.apk)"

clean:
	@rm -rf build .expo

upload-env:
	@cd $(MAKEFILE_DIR) && eas env:create --environment $(BUILD_PROFILE) --name APP_NAME --value $(APP_NAME) --type string --visibility plaintext --force --scope project --non-interactive
	@cd $(MAKEFILE_DIR) && eas env:create --environment $(BUILD_PROFILE) --name EAS_PROJECT_ID --value $(EAS_PROJECT_ID) --type string --visibility plaintext --force --scope project --non-interactive
	@cd $(MAKEFILE_DIR) && eas env:create --environment $(BUILD_PROFILE) --name APP_VERSION --value $(APP_VERSION) --type string --visibility plaintext --force --scope project --non-interactive
	@cd $(MAKEFILE_DIR) && eas env:create --environment $(BUILD_PROFILE) --name AWS_USER_POOL_CLIENT_ID --value $(AWS_USER_POOL_CLIENT_ID) --type string --visibility plaintext --force --scope project --non-interactive
	@cd $(MAKEFILE_DIR) && eas env:create --environment $(BUILD_PROFILE) --name AWS_USER_POOL_ID --value $(AWS_USER_POOL_ID) --type string --visibility plaintext --force --scope project --non-interactive
	@cd $(MAKEFILE_DIR) && eas env:create --environment $(BUILD_PROFILE) --name API_BASE_URL --value $(API_BASE_URL) --type string --visibility plaintext --force --scope project --non-interactive
	@cd $(MAKEFILE_DIR) && eas env:create --environment $(BUILD_PROFILE) --name AWS_COGNITO_DOMAIN --value $(AWS_COGNITO_DOMAIN) --type string --visibility plaintext --force --scope project --non-interactive
