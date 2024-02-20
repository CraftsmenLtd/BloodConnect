DEPLOYMENT_ENVIRONMENT?=localstack
RUNNER_IMAGE_NAME?=dev-image
DOCKER_BUILD_EXTRA_ARGS?=--build-arg="TERRAFORM_VERSION=1.6.5" --build-arg="NODE_MAJOR=20" --build-arg="CHECKOV_VERSION=3.1.40" --build-arg="PYTHON_VERSION=3.11.3"
DOCKER_RUN_MOUNT_OPTIONS:=-v ${PWD}:/app -v /var/run/docker.sock:/var/run/docker.sock -w /app
DOCKER_ENV:=-e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_DEFAULT_REGION
TF_BACKEND_BUCKET_NAME?=localstack
TF_BACKEND_BUCKET_KEY?=localstack
TF_BACKEND_BUCKET_REGION?=eu-west-1
TF_BACKEND_CONFIG:=--backend-config="bucket=$(TF_BACKEND_BUCKET_NAME)" --backend-config="key=$(TF_BACKEND_BUCKET_KEY)" --backend-config="region=$(TF_BACKEND_BUCKET_REGION)"
TF_INIT_PREREQUISITES:=

# Documentation
sphinx-html:
	(cd docs && make html)

ifeq ($(DEPLOYMENT_ENVIRONMENT),localstack)
    TF_RUNNER:=tflocal
    TF_INIT_PREREQUISITES=localstack-start localstack-create-backend-bucket
else
    TF_RUNNER:=terraform
endif

# Localstack
localstack-start:
	localstack start -d

localstack-create-backend-bucket:
	awslocal s3 mb s3://$(TF_BACKEND_BUCKET_NAME) --region=$(TF_BACKEND_BUCKET_REGION) || true

# Terraform
tf-init: $(TF_INIT_PREREQUISITES)
	$(TF_RUNNER) -chdir=iac/terraform init -input=false $(TF_BACKEND_CONFIG) 

tf-plan: $(TF_INIT_PREREQUISITES) tf-init
	$(TF_RUNNER) -chdir=iac/terraform plan $(TF_BACKEND_CONFIG)

tf-apply: $(TF_INIT_PREREQUISITES) tf-init
	$(TF_RUNNER) -chdir=iac/terraform apply -input=false --auto-approve $(TF_BACKEND_CONFIG)

tf-fmt:
	terraform -chdir=iac/terraform fmt -recursive

tf-validate: tf-init
	terraform -chdir=iac/terraform validate

tf-security: tf-init
	checkov --directory iac/terraform

# Nodejs
install-node-packages:
	find . -type f -name package.json -not -path "**node_modules**" -execdir npm i \;

build:
	cd core/services/aws && npm run build-all

package:
	cd core/services/aws && npm run package-all

# Unittest
test:
	npm run test $(TEST_EXTRA_ARGS)

# Lint
lint-code:
	npm run lint

lint: lint-code tf-validate

# Docker dev environment
build-runner-image:
	docker build --no-cache -t $(RUNNER_IMAGE_NAME) $(DOCKER_BUILD_EXTRA_ARGS) .

run-command-%:
	docker run --privileged $(DOCKER_RUN_MOUNT_OPTIONS) $(DOCKER_ENV) $(RUNNER_IMAGE_NAME) make $*

# Dev start project
start-dev: build-runner-image run-command-install-node-packages
