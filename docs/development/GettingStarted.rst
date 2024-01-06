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


Installation
~~~~~~~~~~~~
- `Install Docker <https://docs.docker.com/engine/install/>`_ on your development environment
- Build docker image and install necessary dependencies

 .. code-block:: bash

    make start-dev

Additional Commands
~~~~~~~~~~~~~~~~~~~
- Lint

 .. code-block:: bash

    make run-command-lint  # To run all project lints
    make run-command-lint-code  # To run only code lints
    make run-command-tf-validate  # To validate/lint terraform code
    make run-command-tf-fmt  # To format terraform code

- Unit Tests

 .. code-block:: bash

    make run-command-test  # Run all unittests


FIXME: specific unit test inside docker

- `npm run test -- <path_to_test_file>`: specific test file
- `npm run test -- <path_to_test_file> -t <describe_text_in_test>`: specific test segment

Building and Bundling
~~~~~~~~~~~~~~~~~~~~~
- Services: Run the following commands from `core/services/<cloud_provider>`. The generated files are placed inside `core/services/<cloud_provider>/.build`.

  - `npm run build-service --name=<service_name>`: specific service.
  - `npm run build-all`: all services.
  - `npm run package-service --name=<service_name>`: creates zip files for the particular service to be deployed to cloud in `.build/zips`.
  - `npm run package-all`: creates zip files for all services to be deployed to cloud in `.build/zips`.
