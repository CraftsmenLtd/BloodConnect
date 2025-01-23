# Environment Variables
LOCALSTACK_VERSION?=4.0.2
DEPLOYMENT_ENVIRONMENT?=localstack
LOCALSTACK_AUTH_TOKEN?=localstack-auth-token
RUNNER_IMAGE_NAME?=dev-image
DOCKER_SOCK_MOUNT?=-v /var/run/docker.sock:/var/run/docker.sock
DOCKER_BUILD_EXTRA_ARGS?=--build-arg="TERRAFORM_VERSION=1.10.4" \
                         --build-arg="NODE_MAJOR=20" \
                         --build-arg="CHECKOV_VERSION=3.1.40"
DOCKER_RUN_MOUNT_OPTIONS:=-v $(PWD):/app -w /app
AWS_DEFAULT_REGION?=ap-south-1
AWS_REGION?=$(AWS_DEFAULT_REGION)
AWS_ACCESS_KEY_ID?=aws-access-key-id
AWS_SECRET_ACCESS_KEY?=aws-secret-access-key
AWS_SESSION_TOKEN?=aws-session-token

# Docker Environment Variables
TF_VARS=$(shell env | grep '^TF_VAR_' | awk '{print "-e", $$1}')
DOCKER_ENV?=-e AWS_ACCESS_KEY_ID \
            -e DEPLOYMENT_ENVIRONMENT \
            -e AWS_SECRET_ACCESS_KEY \
            -e AWS_SESSION_TOKEN \
            -e AWS_DEFAULT_REGION \
            -e AWS_REGION \
            -e TF_BACKEND_BUCKET_NAME \
            -e TF_BACKEND_BUCKET_REGION \
            -e TF_BACKEND_BUCKET_KEY $(TF_VARS)

# Terraform Backend Configuration
TF_BACKEND_CONFIG=--backend-config="bucket=$(TF_BACKEND_BUCKET_NAME)" \
                  --backend-config="key=$(TF_BACKEND_BUCKET_KEY)" \
                  --backend-config="region=$(TF_BACKEND_BUCKET_REGION)"

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
ifeq ($(DEPLOYMENT_ENVIRONMENT),localstack)
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

# Terraform Commands
tf-init:
	$(TF_RUNNER) -chdir=$(TF_DIR) init -input=false $(TF_BACKEND_CONFIG)

tf-plan-apply:
	touch $(TF_DIR)/openapi.json
	$(TF_RUNNER) -chdir=$(TF_DIR) plan -input=false -out=tf-apply.out

tf-plan-destroy:
	touch $(TF_DIR)/openapi.json
	$(TF_RUNNER) -chdir=$(TF_DIR) plan -input=false -out=tf-destroy.out --destroy

tf-apply:
	$(TF_RUNNER) -chdir=$(TF_DIR) apply -input=false tf-apply.out

tf-destroy:
	$(TF_RUNNER) -chdir=$(TF_DIR) apply -input=false tf-destroy.out

tf-fmt:
	$(TF_RUNNER) -chdir=iac/terraform fmt -recursive
	$(TF_RUNNER) -chdir=deployment fmt -recursive

tf-validate: tf-init
	$(TF_RUNNER) -chdir=$(TF_DIR) validate

tf-security: tf-init
	checkov --directory $(TF_DIR) $(TF_CHECKOV_SKIP)

tf-output-%:
	$(TF_RUNNER) -chdir=$(TF_DIR) output -raw $*


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
	docker build -t $(RUNNER_IMAGE_NAME) $(DOCKER_BUILD_EXTRA_ARGS) .

run-command-%:
	docker rm -f $(DOCKER_DEV_CONTAINER_NAME)
	docker run --rm -t --name $(DOCKER_DEV_CONTAINER_NAME) --network host \
	           $(DOCKER_RUN_MOUNT_OPTIONS) $(DOCKER_ENV) $(RUNNER_IMAGE_NAME) \
	           make $* NPM_TEST_ARGS=$(NPM_TEST_ARGS) NPM_ARGS=$(NPM_ARGS)

devcontainer:
	docker rm -f $(DOCKER_DEV_CONTAINER_NAME)
	docker run --rm -itd --name $(DOCKER_DEV_CONTAINER_NAME) --network host \
	           $(DOCKER_RUN_MOUNT_OPTIONS) $(DOCKER_ENV) $(RUNNER_IMAGE_NAME) \
			   /bin/bash	           

# Dev commands
start-dev: build-runner-image localstack-start run-command-install-node-packages run-dev

run-dev: run-command-build-node-all run-command-package-all run-command-tf-init \
         run-command-tf-plan-apply run-command-tf-apply


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

# Deploy branch locally
clean-terraform-deployment-files:
	rm -rf deployment/aws/terraform/.terraform \
		deployment/aws/terraform/.terraform.lock.hcl \
		deployment/aws/terraform/errored.tfstate \
		deployment/aws/terraform/openapi.json \
		deployment/aws/terraform/tf-apply.out

deploy-branch-%:
	make run-command-tf-$* \
	DEPLOYMENT_ENVIRONMENT=dev \
	TF_BACKEND_BUCKET_NAME=$(AWS_DEV_TERRAFORM_STATES_BUCKET_NAME) \
	TF_BACKEND_BUCKET_KEY=dev/$(branch).tfstate \
	TF_BACKEND_BUCKET_REGION=$(AWS_REGION) \
	AWS_REGION=$(AWS_REGION) \
	TF_VAR_aws_environment=$(branch) \
	TF_VAR_bloodconnect_domain=$(AWS_DEV_DOMAIN_NAME) \
	TF_VAR_firebase_token_s3_url=$(AWS_DEV_FIREBASE_TOKEN_URL) \
	TF_VAR_google_client_id=$(AWS_DEV_GOOGLE_CLIENT_ID) \
	TF_VAR_google_client_secret=$(AWS_DEV_GOOGLE_CLIENT_SECRET) \
	TF_VAR_facebook_client_id=$(AWS_DEV_FACEBOOK_CLIENT_ID) \
	TF_VAR_facebook_client_secret=$(AWS_DEV_FACEBOOK_CLIENT_SECRET)

deploy-aws-init: clean-terraform-deployment-files
	make deploy-branch-init branch=$(branch)

deploy-aws-apply: run-command-package-all
	make deploy-branch-plan-apply branch=$(branch)
	make deploy-branch-apply branch=$(branch)

deploy-aws-destroy:
	make deploy-branch-plan-destroy branch=$(branch)
	make deploy-branch-destroy branch=$(branch)
