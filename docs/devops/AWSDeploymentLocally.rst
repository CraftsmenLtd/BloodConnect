##############################################
Makefile Commands for Deploying to AWS locally
##############################################

This documentation describes the Makefile commands used for deploying resources to AWS locally.


*********************
Environment Variables
*********************

Before running any of the commands, ensure the following environment variables are defined:

- **AWS_DEV_TERRAFORM_STATES_BUCKET_NAME**: The name of the S3 bucket used for storing Terraform state files.
- **AWS_DEV_DOMAIN_NAME**: The domain name for the application.
- **AWS_DEV_FIREBASE_TOKEN_URL**: The S3 URL where the Firebase token file is stored.
- **AWS_DEV_GOOGLE_CLIENT_ID**: The Google Client ID for authentication.
- **AWS_DEV_GOOGLE_CLIENT_SECRET**: The Google Client Secret for authentication.
- **AWS_DEV_FACEBOOK_CLIENT_ID**: The Facebook Client ID for authentication.
- **AWS_DEV_FACEBOOK_CLIENT_SECRET**: The Facebook Client Secret for authentication.


These environment variables are used in the Makefile commands to pass configuration to Terraform.


********
Commands
********


`deploy-aws-init`
=================

This command initializes the AWS deployment for a specific branch. Additionally, it cleans up any old Terraform files if necessary, ensuring a clean slate for the deployment.

.. code-block:: bash

  make deploy-aws-init branch=feature-xyz

This command:

1. Clears out old Terraform-related files.
2. Initializes the deployment process for the specified branch.


`deploy-aws-apply`
==================

This command creates a Terraform deployment plan for the specified branch and then applies the changes to AWS.

.. code-block:: bash

  make deploy-aws-apply branch=feature-xyz

This command:

1. Generates a Terraform plan for the specified branch (`feature-xyz`).
2. Applies the changes using the generated plan


`deploy-aws-destroy`
====================

This command destroys the AWS resources associated with a specific branch.

.. code-block:: bash

  make deploy-aws-destroy branch=feature-xyz

This command:

1. Generates a plan to destroy the specified branch's resources (feature-xyz).
2. Destroys the resources defined in the plan.


*****
Notes
*****

- The `branch` variable in the commands should be replaced with the name of the branch you are deploying.
- Ensure that AWS credentials and the required permissions are set for the AWS region specified.


********************
Summary of Commands:
********************

.. list-table::

  * - Command
    - Description
  * - **deploy-aws-init**
    - Initializes the deployment.
  * - **deploy-aws-apply**
    - Creates and applies the Terraform deployment plan for a branch.
  * - **deploy-aws-destroy**
    - Destroys the AWS resources for a specific branch.