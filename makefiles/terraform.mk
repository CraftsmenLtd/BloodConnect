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

tf-run-%:
	make tf-$* \
	DEPLOYMENT_ENVIRONMENT=dev \
	TF_BACKEND_BUCKET_NAME=$(AWS_DEV_TERRAFORM_STATES_BUCKET_NAME) \
	TF_BACKEND_BUCKET_KEY=dev/$(BRANCH_NAME).tfstate \
	TF_BACKEND_BUCKET_REGION=$(AWS_REGION) \
	AWS_REGION=$(AWS_REGION) \
	TF_VAR_aws_environment=$(BRANCH_NAME) \
	TF_VAR_bloodconnect_domain=$(AWS_DEV_DOMAIN_NAME) \
	TF_VAR_firebase_token_s3_url=$(AWS_DEV_FIREBASE_TOKEN_URL) \
	TF_VAR_google_client_id=$(AWS_DEV_GOOGLE_CLIENT_ID) \
	TF_VAR_google_client_secret=$(AWS_DEV_GOOGLE_CLIENT_SECRET) \
	TF_VAR_facebook_client_id=$(AWS_DEV_FACEBOOK_CLIENT_ID) \
	TF_VAR_facebook_client_secret=$(AWS_DEV_FACEBOOK_CLIENT_SECRET)