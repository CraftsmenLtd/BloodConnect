DEPLOYMENT_ENVIRONMENT?=localstack
RUNNER_IMAGE_NAME?=dev-image
DOCKER_SOCK_MOUNT?=-v /var/run/docker.sock:/var/run/docker.sock
DOCKER_BUILD_EXTRA_ARGS?=--build-arg="TERRAFORM_VERSION=1.7.3" --build-arg="NODE_MAJOR=20" --build-arg="CHECKOV_VERSION=3.1.40"
DOCKER_RUN_MOUNT_OPTIONS:=-v ${PWD}:/app -w /app
AWS_DEFAULT_REGION?=ap-south-1
AWS_REGION?=$(AWS_DEFAULT_REGION)
TF_VARS=$(shell env | grep '^TF_VAR_' | awk '{print "-e", $$1}')
DOCKER_ENV?=-e AWS_ACCESS_KEY_ID -e DEPLOYMENT_ENVIRONMENT -e AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN -e AWS_DEFAULT_REGION -e AWS_REGION -e TF_BACKEND_BUCKET_NAME -e TF_BACKEND_BUCKET_REGION -e TF_BACKEND_BUCKET_KEY $(TF_VARS)
TF_BACKEND_CONFIG=--backend-config="bucket=$(TF_BACKEND_BUCKET_NAME)" --backend-config="key=$(TF_BACKEND_BUCKET_KEY)" --backend-config="region=$(TF_BACKEND_BUCKET_REGION)"
TF_CHECKOV_SKIP?=--skip-check CKV_AWS_117,CKV_AWS_50,CKV_AWS_116,CKV_AWS_272,CKV_AWS_115
DOCKER_CHECKOV_SKIP?=--skip-check CKV_DOCKER_9
DOCKER_LOCALSTACK_CONTAINER_NAME?=bloodconnect-dev-localstack
DOCKER_DEV_CONTAINER_NAME?=bloodconnect-dev

# Documentation
sphinx-html: bundle-openapi
	rm -rf docs/_build
	(cd docs && make html)

bundle-openapi:
	redocly bundle openapi/versions/v1.json -o docs/openapi/v1.json


# Deployment
ifeq ($(DEPLOYMENT_ENVIRONMENT),localstack)
    TF_RUNNER:=tflocal
    TF_DIR=deployment/localstack/terraform
else
    TF_RUNNER:=terraform
    TF_DIR:=deployment/aws/terraform
endif


check-docker:
	checkov --directory . --framework dockerfile


# Localstack
localstack-start:
	docker rm -f $(DOCKER_LOCALSTACK_CONTAINER_NAME)
	docker run --rm --privileged --name $(DOCKER_LOCALSTACK_CONTAINER_NAME) -itd -e LS_LOG=trace -p 4566:4566 -p 4510-4559:4510-4559 $(DOCKER_SOCK_MOUNT) localstack/localstack

# Terraform
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
	terraform -chdir=iac/terraform fmt -recursive

tf-validate: tf-init
	terraform -chdir=$(TF_DIR) validate

tf-security: tf-init
	checkov --directory $(TF_DIR) $(TF_CHECKOV_SKIP)


# Nodejs
install-node-packages:
	find . -type f -name package.json -not -path "**node_modules**" -execdir npm i \;

build-node-%:
	cd core/services/aws && npm run build-$* $(EXTRA_ARGS)

package-%:
	cd core/services/aws && npm run package-$*


# Unit Test
test:
	npm run test $(EXTRA_ARGS)


# Lint
lint-code:
	npm run lint

lint-api: bundle-openapi
	spectral lint docs/openapi/v1.json --ruleset openapi/.spectral.json

lint: lint-code tf-validate lint-api


# Docker dev environment
build-runner-image:
	docker build -t $(RUNNER_IMAGE_NAME) $(DOCKER_BUILD_EXTRA_ARGS) .

run-command-%:
	docker run --rm -t --name $(DOCKER_DEV_CONTAINER_NAME) --network host $(DOCKER_RUN_MOUNT_OPTIONS) $(DOCKER_ENV) $(RUNNER_IMAGE_NAME) make $* EXTRA_ARGS=$(EXTRA_ARGS)

# Dev commands
start-dev: build-runner-image localstack-start run-command-install-node-packages run-dev

run-dev: run-command-build-node-all run-command-package-all run-command-tf-init run-command-tf-plan-apply run-command-tf-apply

swagger-ui:
	docker-compose -f openapi/docker-compose.yml up -d --build

swagger-ui-restart:
	docker-compose -f openapi/docker-compose.yml down
	make swagger-ui
