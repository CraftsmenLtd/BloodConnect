========================
Github Action Pipelines
========================

The following Pipelines are being used for CI and CD. All pipelines can be found at `<project-root>/.github/workflows`.
Each file will work as a single pipeline.

Deploy Docs
~~~~~~~~~~~~
This pipeline is responsible to deploy sphinx docs. The pipeline will run only on push/merge to master.
And then will deploy latest documentation to github pages.


Continuous Integration
~~~~~~~~~~~~~~~~~~~~~~
This is the pipeline used by developers. It will run on every push on dev branches except master. It includes
- Run unit tests
- Run JS lint
- Validate Terraform
- Terraform static security check
- Docker static security check
- OpenAPI specs lint
- Install to localstack
- Run system integration tests using localstack

Branch Deployment
~~~~~~~~~~~~~~~~~
Branch deployment manually which is being used for deploying dev branches.

Branch Destroy
~~~~~~~~~~~~~~
Destroy resources that are created on Branch Deployment