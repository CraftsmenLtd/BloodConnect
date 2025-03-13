# Auto import env file
ifneq ("$(wildcard .devcontainer/.env)","")
  include .devcontainer/.env
  export
endif

include deployment/aws/terraform/Makefile
include clients/mobile/Makefile

# Makefile flags
MAKEFLAGS+=--no-print-directory

# Environment Variables
LOCALSTACK_VERSION?=4.0.2
LOCALSTACK_AUTH_TOKEN?=localstack-auth-token
RUNNER_IMAGE_NAME?=dev-image
DOCKER_SOCK_MOUNT?=-v /var/run/docker.sock:/var/run/docker.sock
DOCKER_RUN_MOUNT_OPTIONS:=-v $(PWD):/app -w /app
AWS_DEFAULT_REGION?=ap-south-1
AWS_REGION?=$(AWS_DEFAULT_REGION)
AWS_ACCESS_KEY_ID?=aws-access-key-id
AWS_SECRET_ACCESS_KEY?=aws-secret-access-key
AWS_SESSION_TOKEN?=aws-session-token
DEPLOYMENT_ENVIRONMENT_GROUP?=localstack
DEPLOYMENT_ENVIRONMENT?=$(shell git rev-parse --abbrev-ref HEAD | tr '[:upper:]' '[:lower:]')
# Docker Environment Variables
TF_VARS=$(shell env | grep '^TF_VAR_' | awk '{print "-e", $$1}')
DOCKER_ENV?=-e AWS_ACCESS_KEY_ID \
            -e DEPLOYMENT_ENVIRONMENT \
            -e DEPLOYMENT_ENVIRONMENT_GROUP \
            -e AWS_SECRET_ACCESS_KEY \
            -e AWS_SESSION_TOKEN \
            -e AWS_DEFAULT_REGION \
            -e AWS_REGION \
            -e TF_BACKEND_BUCKET_NAME \
            -e TF_BACKEND_BUCKET_REGION \
            -e TF_BACKEND_BUCKET_KEY \
            $(TF_VARS) \
            -e EXPO_TOKEN \
            -e BUILD_PROFILE \
            -e EAS_PROJECT_ID \
            -e APP_VERSION \
            -e APP_NAME \
            -e COUNTRY \
            -e AWS_USER_POOL_CLIENT_ID \
            -e AWS_USER_POOL_ID \
            -e API_BASE_URL \
            -e AWS_COGNITO_DOMAIN


# Checkov Skip Rules
# CKV_AWS_117 - Ensure that AWS Lambda function is configured inside a VPC
# CKV_AWS_50  - X-ray tracing is enabled for Lambda
# CKV_AWS_116 - Ensure that AWS Lambda function is configured for a Dead Letter Queue(DLQ)
# CKV_AWS_272 - Ensure AWS Lambda function is configured to validate code-signing
# CKV_AWS_115 - Ensure that AWS Lambda function is configured for function-level concurrent execution limit
TF_CHECKOV_SKIP?=--skip-check CKV_AWS_117,CKV_AWS_50,CKV_AWS_116,CKV_AWS_272,CKV_AWS_115
DOCKER_CHECKOV_SKIP?=--skip-check CKV_DOCKER_9

# Container Names
DOCKER_LOCALSTACK_CONTAINER_NAME?=bloodconnect-dev-localstack
DOCKER_DEV_CONTAINER_NAME?=bloodconnect-dev
DOCKER_MOBILE_CONTAINER_NAME?=bloodconnect-mobile

# Documentation
sphinx-html: bundle-openapi
	rm -rf docs/_build
	(cd docs && make html)


# API
bundle-openapi:
	redocly bundle openapi/versions/v1.json -o docs/openapi/v1.json --config openapi/configs/redocly.yaml


# Terraform base command:
# Depending on the deployment environment, we choose the appropriate Terraform command and directory.
# If using LocalStack, the 'tflocal' command is used to run Terraform commands within LocalStack,
# and the Terraform directory is set to 'deployment/localstack/terraform'.
ifeq ($(DEPLOYMENT_ENVIRONMENT_GROUP),localstack)
    TF_RUNNER := tflocal
    TF_DIR := deployment/localstack/terraform
else
    TF_RUNNER := terraform
    TF_DIR := deployment/aws/terraform
endif


check-docker:
	checkov --directory . --framework dockerfile


# Localstack
localstack-start:
	docker rm -f $(DOCKER_LOCALSTACK_CONTAINER_NAME)
	docker run --rm --privileged --name $(DOCKER_LOCALSTACK_CONTAINER_NAME) -itd -e LOCALSTACK_AUTH_TOKEN=$(LOCALSTACK_AUTH_TOKEN) -e LS_LOG=trace -p 4566:4566 -p 4510-4559:4510-4559 $(DOCKER_SOCK_MOUNT) localstack/localstack-pro:$(LOCALSTACK_VERSION)


# Nodejs
install-node-packages:
	find . -type f -name package.json -not -path "**node_modules**" -execdir npm i \;

build-node-%:
	cd core/services/aws && npm run build-$* -- $(NPM_ARGS)

package-%:
	cd core/services/aws && npm run package-$*


# Unit Test
test:
	npm run test -- $(NPM_TEST_ARGS)


# Lint
lint-code:
	npm run lint

lint-code-fix:
	npm run lint -- --fix

# Type Check
type-check:
	npm run type-check
	
lint-api: bundle-openapi
	spectral lint docs/openapi/v1.json --ruleset openapi/.spectral.json

lint: lint-code tf-validate lint-api

lint-fix: lint-code-fix


# Docker dev environment
build-runner-image:
	docker build -t $(RUNNER_IMAGE_NAME) .

run-command-%:
	docker rm -f $(DOCKER_DEV_CONTAINER_NAME)
	docker run --rm -t --name $(DOCKER_DEV_CONTAINER_NAME) --network host \
	           $(DOCKER_RUN_MOUNT_OPTIONS) $(DOCKER_ENV) $(RUNNER_IMAGE_NAME) \
	           make $* NPM_TEST_ARGS=$(NPM_TEST_ARGS) NPM_ARGS=$(NPM_ARGS)


# Swagger UI
swagger-ui:
	./openapi/swagger-ui/setup-swagger.sh $(branch) $(email) $(password)
	docker compose -f openapi/docker-compose.yml up -d --build

# Mobile
start-mobile:
	docker rm -f $(DOCKER_MOBILE_CONTAINER_NAME)
	docker run --rm -t --name $(DOCKER_MOBILE_CONTAINER_NAME) --network host -p 8081:8081 \
			$(DOCKER_RUN_MOUNT_OPTIONS) $(DOCKER_ENV) \
			$(RUNNER_IMAGE_NAME) npm run start --prefix clients/mobile


# Deploy Dev Branch from Local Machine
deploy-dev-branch:
	$(MAKE) -s package-all
	$(MAKE) -s clean-terraform-files
	$(MAKE) -s tf-init
	$(MAKE) -s tf-plan-apply
	$(MAKE) -s tf-apply

destroy-dev-branch:
	$(MAKE) -s clean-terraform-files
	$(MAKE) -s tf-init
	$(MAKE) -s tf-plan-destroy
	$(MAKE) -s tf-destroy

prep-dev: install-node-packages build-node-all package-all

# Dev commands
start-dev: build-runner-image localstack-start run-command-install-node-packages run-dev

run-dev: run-command-build-node-all run-command-package-all run-command-tf-init \
         run-command-tf-plan-apply run-command-tf-apply

prepare-mobile-env:
	@echo AWS_USER_POOL_CLIENT_ID=$(shell $(MAKE) -s tf-output-aws_user_pool_client_id) >> clients/mobile/.env
	@echo AWS_USER_POOL_ID=$(shell $(MAKE) -s tf-output-aws_user_pool_id) >> clients/mobile/.env
	@echo API_BASE_URL=$(shell $(MAKE) -s tf-output-aws_api_domain_url) >> clients/mobile/.env
	@echo AWS_COGNITO_DOMAIN=$(shell $(MAKE) -s tf-output-aws_cognito_custom_domain_name) >> clients/mobile/.env
