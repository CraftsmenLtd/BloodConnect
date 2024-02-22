========================
Github Action Pipelines
========================

The following Pipelines are being used for CI and CD. All pipelines can be found at `<project-root>/.github/workflows`.
Each file will work as a single pipeline.

Deploy Docs
~~~~~~~~~~~~
This pipeline is responsible to deploy sphinx docs


Continuous Deployment???? for dev?
~~~~~~~~~~~~~~~~~~~~~~~~~
This is the pipeline used by developers. It includes
- Run unit tests
- Run JS lint
- Validate Terraform
- Terraform static security check
- Install to localstack
- Run system integration tests using localstack
- Deploy AWS dev environment