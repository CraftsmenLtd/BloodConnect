# Auto import env file
ifneq ("$(wildcard .devcontainer/.env)","")
  include .devcontainer/.env
  export
endif

include deployment/aws/terraform/Makefile
include clients/mobile/Makefile

# Makefile flags
MAKEFLAGS+=--no-print-directory

# Show the help listing when make is run with no target
.DEFAULT_GOAL := help

##@ General
help: ## Show this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nBloodConnect make targets\n\nUsage: make \033[36m<target>\033[0m\n"} /^[a-zA-Z0-9_%-]+:.*##/ { printf "  \033[36m%-26s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)
	@printf "\nCommon vars: DEPLOYMENT_ENVIRONMENT_GROUP, BUILD_PROFILE, NPM_TEST_ARGS, NPM_ARGS\n\n"

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
            -e AWS_USER_POOL_CLIENT_ID \
            -e AWS_USER_POOL_ID \
            -e API_BASE_URL \
            -e AWS_COGNITO_DOMAIN \
            -e HOME=/app

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

##@ Documentation & API
sphinx-html: bundle-openapi ## Build the Sphinx HTML docs (bundles OpenAPI first)
	rm -rf docs/_build
	$(MAKE) -C docs html

bundle-openapi: ## Bundle the OpenAPI v1 spec with Redocly
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


##@ Container Checks
check-docker: ## Scan Dockerfiles with Checkov
	checkov --directory . --framework dockerfile


##@ Local Environment
localstack-start: ## Start the LocalStack container
	docker rm -f $(DOCKER_LOCALSTACK_CONTAINER_NAME)
	docker run --rm --privileged --name $(DOCKER_LOCALSTACK_CONTAINER_NAME) -itd -e LOCALSTACK_AUTH_TOKEN=$(LOCALSTACK_AUTH_TOKEN) -e LS_LOG=trace -p 4566:4566 -p 4510-4559:4510-4559 $(DOCKER_SOCK_MOUNT) localstack/localstack-pro:$(LOCALSTACK_VERSION)


##@ Node Build & Package
install-node-packages: ## Install node packages (npm ci)
	npm ci

build-node-%: ## Build a Lambda service, e.g. build-node-all
	cd core/services/aws && npm run build-$* -- $(NPM_ARGS)

package-%: ## Package a Lambda for deployment, e.g. package-all
	cd core/services/aws && npm run package-$*


##@ Test & Lint
test: ## Run all Jest tests (pass args via NPM_TEST_ARGS)
	npm run test -- $(NPM_TEST_ARGS)


lint-code: ## Lint all workspaces with ESLint
	npm run lint

lint-code-fix: ## Lint all workspaces and auto-fix issues
	npm run lint -- --fix

type-check: ## Run the TypeScript type checker
	npm run type-check

lint-api: bundle-openapi ## Lint the OpenAPI spec with Spectral
	spectral lint docs/openapi/v1.json --ruleset openapi/.spectral.json

lint: lint-code tf-validate lint-api ## Lint code, Terraform, and the OpenAPI spec

lint-fix: lint-code-fix ## Auto-fix lint issues

##@ Docker Dev Environment
build-runner-image: ## Build the dev runner Docker image
	docker build --build-arg HOST_UID=$(shell id -u) --build-arg HOST_GID=$(shell id -g) -t $(RUNNER_IMAGE_NAME) .

run-command-%: ## Run a make target inside the dev container, e.g. run-command-test
	docker rm -f $(DOCKER_DEV_CONTAINER_NAME) || true
	docker run --rm -t --name $(DOCKER_DEV_CONTAINER_NAME) --network host \
	           $(DOCKER_RUN_MOUNT_OPTIONS) $(DOCKER_ENV) $(RUNNER_IMAGE_NAME) \
	           make $* NPM_TEST_ARGS=$(NPM_TEST_ARGS) NPM_ARGS=$(NPM_ARGS)

##@ API Explorer
swagger-ui: ## Launch the Swagger UI (branch/email/password vars)
	./openapi/swagger-ui/setup-swagger.sh $(branch) $(email) $(password)
	docker compose -f openapi/docker-compose.yml up -d --build

##@ Deploy
deploy-dev-branch: ## Build and deploy the current branch to the dev environment
	$(MAKE) build-node-all
	$(MAKE) clean-terraform-files
	$(MAKE) tf-init DEPLOYMENT_ENVIRONMENT_GROUP=dev
	$(MAKE) tf-plan-apply DEPLOYMENT_ENVIRONMENT_GROUP=dev
	$(MAKE) tf-apply DEPLOYMENT_ENVIRONMENT_GROUP=dev

destroy-dev-branch: ## Destroy the current branch's dev environment resources
	$(MAKE) -s clean-terraform-files
	$(MAKE) -s tf-init DEPLOYMENT_ENVIRONMENT_GROUP=dev
	$(MAKE) -s tf-plan-destroy DEPLOYMENT_ENVIRONMENT_GROUP=dev
	$(MAKE) -s tf-destroy DEPLOYMENT_ENVIRONMENT_GROUP=dev

##@ Setup & Dev
prep-dev: install-node-packages build-node-all package-all ## Install packages, build and package all Lambdas

start-dev: build-runner-image localstack-start run-command-install-node-packages run-dev ## Full local env: runner image + LocalStack + deploy

run-dev: run-command-build-node-all run-command-tf-init run-command-tf-plan-apply run-command-tf-apply ## Build and deploy inside the dev container

##@ Mobile (env)
prepare-mobile-env: ## Write clients/mobile/.env from Terraform outputs
	@echo AWS_USER_POOL_CLIENT_ID=$(shell $(MAKE) -s tf-output-aws_user_pool_client_id) >> clients/mobile/.env
	@echo AWS_USER_POOL_ID=$(shell $(MAKE) -s tf-output-aws_user_pool_id) >> clients/mobile/.env
	@echo API_BASE_URL=$(shell $(MAKE) -s tf-output-aws_api_domain_url) >> clients/mobile/.env
	@echo AWS_COGNITO_DOMAIN=$(shell $(MAKE) -s tf-output-aws_cognito_custom_domain_name) >> clients/mobile/.env

fetch-google-service-file: ## Download google-services.json from the backend bucket
	@aws s3 cp s3://$(TF_BACKEND_BUCKET_NAME)/credentials/$(BUILD_PROFILE)/google-services.json clients/mobile/
