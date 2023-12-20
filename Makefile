RUNNER_IMAGE_NAME?=dev-image
DOCKER_BUILD_EXTRA_ARGS?=--build-arg="TERRAFORM_VERSION=1.6.5" --build-arg="NODE_MAJOR=18"
DOCKER_RUN_MOUNT_OPTIONS:=-v ${PWD}:/app -w /app
DOCKER_ENV:=-e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_DEFAULT_REGION

# Documentation
sphinx-html:
	(cd docs && make html)


# Terraform
tf-fmt:
	terraform -chdir=iac/terraform fmt -recursive

tf-validate:
	terraform -chdir=iac/terraform init -input=false $(TF_BACKEND_CONFIG)
	terraform -chdir=iac/terraform validate


# Nodejs
install-node-packages:
	find . -type f -name package.json -not -path "**node_modules**" -execdir npm i \;


# Unittest
test:
	npm run test $(TEST_EXTRA_ARGS)


# Lint
lint-code:
	npm run lint

lint: lint-code tf-validate


# Docker dev environment
build-runner-image:
	docker build -t $(RUNNER_IMAGE_NAME) $(DOCKER_BUILD_EXTRA_ARGS) .

run-command-%:
	docker run $(DOCKER_RUN_MOUNT_OPTIONS) $(DOCKER_ENV) $(RUNNER_IMAGE_NAME) make $*


# Dev start project
start-dev: build-runner-image run-command-install-node-packages
