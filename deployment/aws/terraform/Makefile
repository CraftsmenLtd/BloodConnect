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

clean-terraform-files:
	rm -rf deployment/aws/terraform/.terraform \
		deployment/aws/terraform/.terraform.lock.hcl \
		deployment/aws/terraform/errored.tfstate \
		deployment/aws/terraform/openapi.json \
		deployment/aws/terraform/tf-apply.out \
		deployment/aws/terraform/tf-destroy.out
