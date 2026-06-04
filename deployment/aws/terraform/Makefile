# Auto import env file
ifneq ("$(wildcard deployment/aws/terraform/.env)","")
  include deployment/aws/terraform/.env
  export
endif

# Terraform Backend Configuration
TF_BACKEND_CONFIG=--backend-config="bucket=$(TF_BACKEND_BUCKET_NAME)" \
                  --backend-config="key=$(DEPLOYMENT_ENVIRONMENT_GROUP)/$(DEPLOYMENT_ENVIRONMENT).tfstate" \
                  --backend-config="region=$(AWS_REGION)"

TF_VAR_aws_environment?=$(DEPLOYMENT_ENVIRONMENT)

##@ Terraform
# Terraform Commands
tf-init: ## Initialize Terraform with the backend config
	$(TF_RUNNER) -chdir=$(TF_DIR) init -input=false $(TF_BACKEND_CONFIG)

tf-plan-apply: ## Create a Terraform apply plan (tf-apply.out)
	touch $(TF_DIR)/openapi.json
	$(TF_RUNNER) -chdir=$(TF_DIR) plan -input=false -out=tf-apply.out

tf-plan-destroy: ## Create a Terraform destroy plan (tf-destroy.out)
	touch $(TF_DIR)/openapi.json
	$(TF_RUNNER) -chdir=$(TF_DIR) plan -input=false -out=tf-destroy.out --destroy

tf-apply: ## Apply the saved tf-apply.out plan
	$(TF_RUNNER) -chdir=$(TF_DIR) apply -input=false tf-apply.out

tf-destroy: ## Apply the saved tf-destroy.out plan
	$(TF_RUNNER) -chdir=$(TF_DIR) apply -input=false tf-destroy.out

tf-fmt: ## Format Terraform files recursively
	$(TF_RUNNER) -chdir=iac/terraform fmt -recursive
	$(TF_RUNNER) -chdir=deployment fmt -recursive

tf-validate: tf-init ## Validate the Terraform configuration
	$(TF_RUNNER) -chdir=$(TF_DIR) validate

tf-security: tf-init ## Scan Terraform with Checkov
	checkov --directory $(TF_DIR) $(TF_CHECKOV_SKIP)

tf-output-%: ## Show a Terraform output, e.g. tf-output-aws_api_domain_url
	$(TF_RUNNER) -chdir=$(TF_DIR) output $*

clean-terraform-files: ## Remove local Terraform state and plan artifacts
	rm -rf deployment/aws/terraform/.terraform \
		deployment/aws/terraform/.terraform.lock.hcl \
		deployment/aws/terraform/errored.tfstate \
		deployment/aws/terraform/openapi.json \
		deployment/aws/terraform/tf-apply.out \
		deployment/aws/terraform/tf-destroy.out
