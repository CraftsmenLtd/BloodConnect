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
* Run unit tests
* Run JS lint
* Docker static security check
* OpenAPI specs lint
* Validate Terraform
* Terraform static security check

Branch Deployment
~~~~~~~~~~~~~~~~~
The Branch Deployment pipeline is triggered manually through GitHub Actions. It is used for deploying development branches to the AWS infrastructure. Here’s how it works:
1. Navigate to the **Actions** tab in your GitHub repository.
2. Select the **Branch Deployment** workflow.
3. Click on **Run workflow**.
4. Choose the branch you want to deploy.
5. Click on the **Run workflow** button to start the deployment process.

**What this pipeline does:**
- **Set Deployment Environment**: Initializes the deployment environment based on the branch name.
- **Build and Push Docker Image**: Builds Docker image and pushes it to the registry if needed.
- **Deploy Branch Infrastructure**: Deploys the associated infrastructure to the specified environment.


Stage Deployment
~~~~~~~~~~~~~~~~~
The Stage Deployment pipeline is automatically triggered on pushes to the `master` branch. This pipeline is responsible for deploying changes to the staging environment. Here’s how to deploy:
1. Make sure your changes are pushed to the `master` branch.
2. The pipeline will automatically run and deploy the latest changes to the staging environment.

**What this pipeline does:**
- **Build and Push Docker Image**: Builds Docker image and pushes it to the registry if needed.
- **Lint, Test, and Security Check**: Runs linting, unit tests, security, and Localstack checks on the code.
- **Deploy Stage Infrastructure**: Deploys the infrastructure to the staging environment.


Production Deployment
~~~~~~~~~~~~~~~~~~~~~
The Production Deployment pipeline is triggered when a tag is created. This pipeline ensures that the deployed version matches the latest commit on the `master` branch. Here’s how to deploy to production:
1. Create a Git tag from the `master` branch.
2. The Production Deployment pipeline will automatically run upon tagging and will deploy your changes to the production environment.

**What this pipeline does:**
- **Check Tag Hash Against Master Branch Hash**: Verifies that the commit hash associated with the tag matches the latest commit on the master branch to ensure the tag is created from `master`.
- **Build and Push Docker Image**: Builds Docker image and pushes it to the registry if needed.
- **Lint, Test, and Security Check**: Runs linting, unit tests, and security checks on the code.
- **Deploy Branch Infrastructure**: Deploys the Docker image and associated infrastructure to the production environment.

If you want to deploy changes to either the staging or production environment, ensure that your code is tested and ready for deployment, and follow the respective steps outlined above.
