TODO: move me to docs/ dir

==========
Deployment
==========

The `deployment` directory contains all `Infrastructure as Code (IaC) <https://en.wikipedia.org/wiki/Infrastructure_as_code>`_

Directory Structure
~~~~~~~~~~~~~~~~~~~

This is deployment directory example:

::
    BloodConnect
    └── deployment
        ├── terraform
        │   ├── aws
        │   │   ├── frontend
        │   │   └── backend
        │   └── gcp
        ├── serverless
        └── pulumi


- `deployment` dir contains IaC tool names (e.g. `Terraform <https://www.terraform.io/>`_, `Pulumi <https://www.pulumi.com/>`_ etc.) which is being used to deploy. It can contains multiple tools.
- Each IaC tool named dir contains cloud platform dirs (e.g. `Amazon Web Services <https://aws.amazon.com/>`_, `Google Cloud Platform <https://cloud.google.com/>`_ etc.). It can contain multiple dirs.
- Each IaC tool named dir contains core level codes which will work for all cloud platforms
- Each cloud platform dir contains modules of the project with separate dirs (e.g. frontend, backend, services etc.)
- IaC codes should be independent of deployment environment (e.g. test, staging, prod) but it can accept environment level values as variables
- IaC should have a runbook which will be used by deployment pipeline


Deployment Coverage
~~~~~~~~~~~~~~~~~~~
- Terraform/AWS - initially starting with this one

Terraform Guideline
~~~~~~~~~~~~~~~~~~~
- Follow `HasiCorp <https://www.hashicorp.com/>`_ provided `styleguide <https://developer.hashicorp.com/terraform/language/syntax/style>`_
- Add a blank line at the end of each resource
- A tag must be used to track payment
- A terraform validation step must be added in build or release pipeline which will be executed before releasing
- Must provide variable description and type
..  code-block:: hcl2
    variable "image_id" {
      type = string
    }

    #prefered
    variable "image_id" {
      description = "ec2 image id"
      type = string
    }

- Must provide lambda description
- Always format terraform using `terraform fmt` command before git commit