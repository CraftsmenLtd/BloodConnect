DEPLOYMENT_ENVIRONMENT?=localstack
RUNNER_IMAGE_NAME?=dev-image
DOCKER_BUILD_EXTRA_ARGS?=--build-arg="TERRAFORM_VERSION=1.7.3" --build-arg="NODE_MAJOR=20" --build-arg="CHECKOV_VERSION=3.1.40" --build-arg="PYTHON_VERSION=3.11.3"
DOCKER_RUN_MOUNT_OPTIONS:=-v ${PWD}:/app -v /var/run/docker.sock:/var/run/docker.sock -w /app
DOCKER_ENV?=-e AWS_ACCESS_KEY_ID -e DEPLOYMENT_ENVIRONMENT -e AWS_SECRET_ACCESS_KEY -e AWS_DEFAULT_REGION -e TF_BACKEND_BUCKET_NAME -e TF_BACKEND_BUCKET_REGION -e TF_BACKEND_BUCKET_KEY -e TF_VARS
TF_BACKEND_BUCKET_KEY?=localstack
TF_BACKEND_BUCKET_REGION?=ap-south-1
TF_BACKEND_BUCKET_NAME?=localstack
TF_BACKEND_CONFIG=--backend-config="bucket=$(TF_BACKEND_BUCKET_NAME)" --backend-config="key=$(TF_BACKEND_BUCKET_KEY)" --backend-config="region=$(TF_BACKEND_BUCKET_REGION)"
TF_INIT_PREREQUISITES:=
TF_CHECKOV_SKIP:=--skip-check CKV_AWS_117,CKV_AWS_50,CKV_AWS_116,CKV_AWS_272,CKV_AWS_115
DOCKER_CHECKOV_SKIP:=--skip-check CKV_DOCKER_9

# Documentation
sphinx-html:
	(cd docs && make html)


# Deployment
ifeq ($(DEPLOYMENT_ENVIRONMENT),localstack)
    TF_RUNNER:=tflocal
    TF_INIT_PREREQUISITES=localstack-start localstack-create-backend-bucket
    TF_DIR=deployment/localstack/terraform
else
    TF_RUNNER:=terraform
    TF_DIR:=deployment/aws/terraform
endif


check-docker:
	checkov --directory . --framework dockerfile


# Localstack
localstack-start:
	localstack start -d

localstack-create-backend-bucket:
	awslocal s3api create-bucket --bucket $(TF_BACKEND_BUCKET_NAME) --create-bucket-configuration LocationConstraint=$(TF_BACKEND_BUCKET_REGION) || true
	awslocal s3api put-bucket-policy --bucket $(TF_BACKEND_BUCKET_NAME) --policy '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:ListBucket","Resource":"arn:aws:s3:::$(TF_BACKEND_BUCKET_NAME)"},{"Effect":"Allow","Action":["s3:GetObject","s3:PutObject"],"Resource":"arn:aws:s3:::$(TF_BACKEND_BUCKET_NAME)/$(TF_BACKEND_BUCKET_KEY)"}]}'


# Terraform
tf-init: $(TF_INIT_PREREQUISITES)
	$(TF_RUNNER) -chdir=$(TF_DIR) init -input=false $(TF_BACKEND_CONFIG)

tf-plan-apply:
	$(TF_RUNNER) -chdir=$(TF_DIR) plan $(TF_VARS) -input=false -out=tf-apply.out

tf-plan-destroy:
	$(TF_RUNNER) -chdir=$(TF_DIR) plan $(TF_VARS) -input=false -out=tf-destroy.out --destroy

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

lint: lint-code tf-validate


# Docker dev environment
build-runner-image:
	docker build -t $(RUNNER_IMAGE_NAME) $(DOCKER_BUILD_EXTRA_ARGS) .

run-command-%:
	docker run --privileged -t --network host $(DOCKER_RUN_MOUNT_OPTIONS) $(DOCKER_ENV) $(RUNNER_IMAGE_NAME) make $* EXTRA_ARGS=$(EXTRA_ARGS)

# Dev commands
start-dev: build-runner-image run-command-install-node-packages run-dev

run-dev: run-command-build-node-all run-command-package-all run-command-tf-init run-command-tf-plan-apply run-command-tf-apply