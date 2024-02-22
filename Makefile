DEPLOYMENT_ENVIRONMENT?=localstack
RUNNER_IMAGE_NAME?=dev-image
DOCKER_BUILD_EXTRA_ARGS?=--build-arg="TERRAFORM_VERSION=1.7.3" --build-arg="NODE_MAJOR=20" --build-arg="CHECKOV_VERSION=3.1.40" --build-arg="PYTHON_VERSION=3.11.3"
DOCKER_RUN_MOUNT_OPTIONS:=-v ${PWD}:/app -v /var/run/docker.sock:/var/run/docker.sock -w /app
TF_BACKEND_BUCKET_NAME?=localstack
TF_BACKEND_BUCKET_KEY?=localstack
TF_BACKEND_BUCKET_REGION?=us-east-1
DOCKER_ENV?=-e AWS_ACCESS_KEY_ID -e DEPLOYMENT_ENVIRONMENT -e AWS_SECRET_ACCESS_KEY -e AWS_DEFAULT_REGION -e TF_BACKEND_BUCKET_NAME -e TF_BACKEND_BUCKET_REGION -e TF_BACKEND_BUCKET_KEY -e TF_VARS
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
	HOSTNAME_EXTERNAL=localhost localstack start -d 

localstack-create-backend-bucket:
	awslocal s3 mb s3://$(TF_BACKEND_BUCKET_NAME) --region=$(TF_BACKEND_BUCKET_REGION) || true

# Terraform
tf-init: $(TF_INIT_PREREQUISITES)
	$(TF_RUNNER) -chdir=iac/terraform init -input=false $(TF_BACKEND_CONFIG) 

tf-plan: $(TF_INIT_PREREQUISITES) tf-init
	$(TF_RUNNER) -chdir=iac/terraform plan $(TF_VARS) -input=false -out=tf-apply.out

tf-apply: $(TF_INIT_PREREQUISITES) tf-init
	$(TF_RUNNER) -chdir=iac/terraform apply -input=false tf-apply.out

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

# Unit Test
test:
	npm run test $(TEST_EXTRA_ARGS)

# Lint
lint-code:
	npm run lint

lint: lint-code tf-validate

# Docker dev environment
build-runner-image:
	docker build -t $(RUNNER_IMAGE_NAME) $(DOCKER_BUILD_EXTRA_ARGS) .

test2:
	$(foreach docker_env,$(ALL_DOCKER_ENV),--env $(docker_env))

run-command-%:
	docker run --privileged -t --network host $(DOCKER_RUN_MOUNT_OPTIONS) $(DOCKER_ENV) $(RUNNER_IMAGE_NAME) make $*

# Dev start project
start-dev: build-runner-image run-command-install-node-packages build package tf-init tf-apply
