=================
Setup the Project
=================

Git Setup
~~~~~~~~~
- `Install Git <https://git-scm.com/book/en/v2/Getting-Started-Installing-Git>`_ on your development environment.
- Clone the project.

 .. code-block:: bash

    git clone git@github.com:CraftsmenLtd/BloodConnect.git

- Open the project in terminal/IDE.
- Execute to change the git hooks to `.githooks` directory.

 .. code-block:: bash

    git config core.hooksPath .githooks

- Make the directory executable

 .. code-block:: bash

    chmod +x .githooks/*


Pre-requisites
~~~~~~~~~~~~~~
- `Install Docker <https://docs.docker.com/engine/install/>`_ on your development environment
- Install Make
    * MacOS

     .. code-block:: bash

        brew install make gnu

    * Linux
     Use whatever your package manager (apt, dnf, pacman, yum) is to install the packages.
     For example with Debian

     .. code-block:: bash

        apt install make gnu

First Time Install
~~~~~~~~~~~~~~~~~~
Make sure your docker is up and running. Ensure you don't have any containers named `localstack-main` running as well.
Run the following command to get everything up and running.

.. code-block:: bash

    make start-dev

This will

- build an image named `dev-image`
- Install all necessary node packages
- Build the node applications
- Package the node applications
- Initialize Terraform for Localstack
- Plan the current Terraform code for Localstack
- Deploy the current Terraform code for Localstack

You should hopefully see some terraform output variables being spat at you if everything goes well. Localstack will emulate aws locally, feel free to hit the api urls if you want.


Regular Development
~~~~~~~~~~~~~~~~~~~
When you make changes to the code base and want to run things to test; you can always just run the 
 .. code-block:: bash

    make run-dev

But a more efficient way might be to pick and choose what needs doing,

- Install New node modules

 .. code-block:: bash

    make run-command-install-node-packages


- Lint

 .. code-block:: bash

    make run-command-lint  # To run all project lints
    make run-command-lint-code  # To run only code lints
    make run-command-tf-validate  # To validate/lint terraform code
    make run-command-tf-fmt  # To format terraform code

- Unit Tests

 .. code-block:: bash

    make run-command-test  # Run all unittests
    make run-command-test EXTRA_ARGS="'-- <path_to_test_file>'"  # specific test file
    make run-command-test  EXTRA_ARGS="'-- <path_to_test_file> -t <describe_text_in_test>'"  # specific test segment

- Build Code
 The generated files are placed inside `core/services/<cloud_provider>/.build`.

 .. code-block:: bash

    make run-command-build-node-all  # build all services and keep files in `.build` directory.
    make run-command-build-node-service --name=<service_name>: specific service.

- Package Code

 .. code-block:: bash

    make run-command-package-all  # build all and creates zip files for all services to be deployed to cloud in `.build/zips`.
    make run-command-package-service --name=<service_name>  # build all and creates zip files for a particular services to be deployed to cloud in `.build/zips`.

- Plan Localstack Terraform Deployment

 .. code-block:: bash

    make run-command-tf-plan-apply

- Deploy Localstack Terraform

 .. code-block:: bash

    make run-command-tf-apply

|

As you've noticed; we prefix commands with `run-command-` keyword; this lets us execute command inside our locally available dev docker image thus saving you the hassle of having to manage:

 - Terraform
 - Nodejs
 - Python
 - Localstack
 - AWS

You can however run these commands locally too. But that would mean you're expected to configure your machine to match what the docker image does.

Deploying into Personal  Development Environment
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
You might want to deploy your code into aws to have a fully fledged environment. There are couple of ways you can achieve this. The simplest way would be to make a git commit.

- Git Commit
.. image:: assets/branch-deploy.png
   :width: 600
Here you can manually trigger the branch-deploy pipeline that will deploy your changes described at `deployment/aws/terraform/variables.tf <https://github.com/CraftsmenLtd/BloodConnect/tree/master/deployment/aws/terraform/variables.tf>`_.
Don't forget to use the destroy-branch pipeline after use.

- From Local Environment
This needs a bit of setup. Firstly you will have to assume the deployment role that github action assumes.

.. code-block:: bash

    export $(printf "AWS_ACCESS_KEY_ID=%s AWS_SECRET_ACCESS_KEY=%s AWS_SESSION_TOKEN=%s" \
    $(aws sts assume-role \
    --role-arn arn:aws:iam::<bloodconnect aws account id>:role/GitHubActionsAndDevRole \
    --role-session-name <a random session name> \
    --query "Credentials.[AccessKeyId,SecretAccessKey,SessionToken]" \
    --output text))
Note: The above role is maintained in this repo: https://github.com/CraftsmenLtd/Bloodconnect-oidc
You can now start creating the command, there are a few variables that terraform needs. You can export them as environment variables or you can pass them as arguments to the make command.

.. code-block:: bash

    make run-command-tf-init VARIABLE_NAME=value
Or
.. code-block:: bash

    VARIABLE_NAME=value make run-command-tf-init

The table below explains the variables that needs to be passed
.. list-table:: Required variables for aws deployment
   :header-rows: 1

   * - Variable Name
     - Variable Description
     - Value
     - Default
   * - DEPLOYMENT_ENVIRONMENT
     - This variable dictates if the makefile should use localstack or aws. If you're deploying into aws, your value here must match your branch name.
     - sakib-branch
     - localstack
   * - TF_BACKEND_BUCKET_NAME
     - This sets up the bucket name terraform will use to store state
     - terraform-bloodconnect-ci-dev
     - 
   * - TF_BACKEND_BUCKET_KEY
     - This sets up the state file name terraform will use, the value should be dev/<your branch name>
     - dev/sakib-branch
     - 
   * - TF_BACKEND_BUCKET_REGION
     - This sets up the bucket region name terraform will use, the value should be ap-south-1
     - ap-south-1
     - 
   * - AWS_REGION
     - This sets up the aws region to use, the value should be ap-south-1
     - ap-south-1
     - 
   * - TF_VAR_<the_variable_name>
     - This is a crucial value, this dictates everything that gets passed into terraform as defined `deployment/aws/terraform/variables.tf <https://github.com/CraftsmenLtd/BloodConnect/tree/master/deployment/aws/terraform/variables.tf>`_.
     - sakib-branch
     - 

With all that lets make an example command. The following command will initiate terraform.

.. code-block:: bash
    make run-command-tf-init \
    DEPLOYMENT_ENVIRONMENT=sakib-branch \
    TF_BACKEND_BUCKET_NAME=terraform-bloodconnect-ci-dev \
    TF_BACKEND_BUCKET_KEY=dev/sakib-branch \
    TF_BACKEND_BUCKET_REGION=ap-south-1 \
    AWS_REGION=ap-south-1 \
    TF_VARS="-var='aws_environment=sakib-branch'"
Or
.. code-block:: bash
    DEPLOYMENT_ENVIRONMENT=sakib-branch \
    TF_BACKEND_BUCKET_NAME=terraform-bloodconnect-ci-dev \
    TF_BACKEND_BUCKET_KEY=dev/sakib-branch \
    TF_BACKEND_BUCKET_REGION=ap-south-1 \
    AWS_REGION=ap-south-1 \
    TF_VAR_aws_environment=sakib-branch \
    make run-command-tf-init

Now lets plan to apply this.

.. code-block:: bash
    DEPLOYMENT_ENVIRONMENT=sakib-branch \
    TF_BACKEND_BUCKET_NAME=terraform-bloodconnect-ci-dev \
    TF_BACKEND_BUCKET_KEY=dev/sakib-branch \
    TF_BACKEND_BUCKET_REGION=ap-south-1 \
    AWS_REGION=ap-south-1 \
    TF_VAR_aws_environment=sakib-branch \
    make run-command-tf-plan-apply

And applying this.

.. code-block:: bash
    DEPLOYMENT_ENVIRONMENT=sakib-branch \
    TF_BACKEND_BUCKET_NAME=terraform-bloodconnect-ci-dev \
    TF_BACKEND_BUCKET_KEY=dev/sakib-branch \
    TF_BACKEND_BUCKET_REGION=ap-south-1 \
    AWS_REGION=ap-south-1 \
    TF_VAR_aws_environment=sakib-branch \
    make run-command-tf-apply


And planning to destroy this.

.. code-block:: bash
    DEPLOYMENT_ENVIRONMENT=sakib-branch \
    TF_BACKEND_BUCKET_NAME=terraform-bloodconnect-ci-dev \
    TF_BACKEND_BUCKET_KEY=dev/sakib-branch \
    TF_BACKEND_BUCKET_REGION=ap-south-1 \
    AWS_REGION=ap-south-1 \
    TF_VAR_aws_environment=sakib-branch \
    make run-command-tf-plan-destroy

And finally destroying this.

.. code-block:: bash
    DEPLOYMENT_ENVIRONMENT=sakib-branch \
    TF_BACKEND_BUCKET_NAME=terraform-bloodconnect-ci-dev \
    TF_BACKEND_BUCKET_KEY=dev/sakib-branch \
    TF_BACKEND_BUCKET_REGION=ap-south-1 \
    AWS_REGION=ap-south-1 \
    TF_VAR_aws_environment=sakib-branch \
    make run-command-tf-destroy

If you don't want to be using such a long command you can always export the stuff that are static to you. For example, 

.. code-block:: bash
    export DEPLOYMENT_ENVIRONMENT=sakib-branch

Now we don't need to be passing that every time. Ofcourse this means if you want to test in it localstack you will have to unset,

.. code-block:: bash
    unset DEPLOYMENT_ENVIRONMENT
