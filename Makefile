RUNNER_IMAGE_NAME?=dev-image
DOCKER_BUILD_EXTRA_ARGS?=
DOCKER_RUN_MOUNT_OPTIONS:=-v ${PWD}:/app -w /app
DOCKER_ENV:=-e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_DEFAULT_REGION


# Documentation
sphinx-init:
	docker run -it --rm -v $(PWD)/docs:/docs sphinxdoc/sphinx sphinx-quickstart

sphinx-html:
	docker run --rm -v $(PWD)/docs:/docs sphinxdoc/sphinx make html


# Terraform
tf-fmt:
	terraform -chdir=iac/terraform/aws fmt -recursive


# Docker dev environment
build-runner-image:
	docker build -t $(RUNNER_IMAGE_NAME) $(DOCKER_BUILD_EXTRA_ARGS) .

# FIXME: make: *** No rule to make target 'tf-fmt'
run-command-%:
	docker run $(DOCKER_RUN_MOUNT_OPTIONS) $(DOCKER_ENV) $(RUNNER_IMAGE_NAME) make $*
