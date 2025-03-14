======================
Infrastructure as Code
======================

The `iac` directory contains all `Infrastructure as Code (IaC) <https://en.wikipedia.org/wiki/Infrastructure_as_code>`_

Directory Structure
~~~~~~~~~~~~~~~~~~~

The Iac directory is as follows:

 .. code-block:: text

    BloodConnect
    └── iac
        ├── terraform
        │   ├── aws
        │   │   ├── auth
        │   │   └── donate
        │   └── gcp
        ├── serverless
        └── pulumi


- `iac` dir contains IaC tool names (e.g. `Terraform <https://www.terraform.io/>`_, `Pulumi <https://www.pulumi.com/>`_ etc.) which is being used to deploy. It can contains multiple tools.
- Each IaC tool named dir contains cloud platform dirs (e.g. `Amazon Web Services <https://aws.amazon.com/>`_, `Google Cloud Platform <https://cloud.google.com/>`_ etc.). It can contain multiple dirs.
- Each IaC tool named dir contains core level codes which will work for all cloud platforms
- Each cloud platform dir contains modules of the project with separate dirs (e.g. frontend, backend, services etc.)
- IaC codes should be independent of deployment environment (e.g. test, staging, prod) but it can accept environment level values as variables
- IaC should have a runbook which will be used by deployment pipeline


IaC Coverage
~~~~~~~~~~~~
- Terraform/AWS - initially starting with **Terraform Version: 1.6.5** and AWS

Terraform Guideline
~~~~~~~~~~~~~~~~~~~
- Follow `HasiCorp <https://www.hashicorp.com/>`_ provided `styleguide <https://developer.hashicorp.com/terraform/language/syntax/style>`_
- Add a blank line at the end of each resource
- A tag must be used to track cost
- A terraform validation step must be added in build or release pipeline which will be executed before releasing

 .. code-block:: bash

    terraform validate  # Command of terraform to validate it
    make run-command-tf-validate  # Validate terraform using dockerized dev environment

- Must provide variable description and type

 .. literalinclude:: ../assets/codes/terraform/variable.tf

- Must provide lambda description
- Always format terraform using `terraform fmt` command before git commit. There is a make command for it

 .. code-block:: bash

    make run-command-tf-fmt

- Check terraform static security using

 .. code-block:: bash

    make run-command-tf-security
