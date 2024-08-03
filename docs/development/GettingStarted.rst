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
When you make changes to the code base and want to run things to test; you can always just run the `First Time Install`_. But a more efficient way might be to

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
