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
Firstly familiarize yourself with terminologies in this project. There are a few to keep in mind.

+-----------+----------+-------------+---------+
| Concept   | Keyword  | Description | Example |
+===========+==========+=============+=========+
| Deployment Environment Group | DEPLOYMENT_ENVIRONMENT_GROUP | this denotes the type of environment you will be deploying to in our infrastructure which allows you to access all resources related to that environment group for example github secrets | `localstack|dev|stage|prod` |
+-----------+----------+-------------+---------+
| Deployment Environment | DEPLOYMENT_ENVIRONMENT | this denotes the name of the environment that your deployment will be associated with | `branch-name|ticket-name|your-name|stage|prod` |
+-----------+----------+-------------+---------+
| Branch Deployment | Branch Name | used as DEPLOYMENT_ENVIRONMENT along with DEPLOYMENT_ENVIRONMENT_GROUP set to dev to deploy a standalone app | `branch-name` |
+-----------+----------+-------------+---------+

The project expects you to use localstack and docker as a development environment. You can choose one of two ways to start developing.
- Dev Container: This is where you're not expected to require any setup beyond aws access in your terminal and docker along with make.
- Container: You are not expected to have any binaries for writing code, compiling code or packaging code but you will need binaries to get lint support and other integration with your IDE of choice.
- Pipeline: This is the easiest yet the most time consuming process because here you will have to commit your code and run the branch deploy pipeline.
- Native: This is where you will have to setup all necessary binaries related to the project. We will not go into the details of this.


 .. warning::

    Check out into a new branch please


Dev Container
^^^^^^^^^^^^^
Read more about dev containers `here <https://code.visualstudio.com/docs/devcontainers/containers>`_.

 .. warning::

    Dev containers and localstack are still not working together. Therefore commands make docker calls in order to setup localstack will not work. For example `localstack-start` will not work from the dev containers cli.
Make sure you have `ms-vscode-remote.remote-containers` installed on your vscode.

 .. warning::

    This guide assumes you will use dev containers to deploy a branch into aws.
Before starting a dev container, you must ensure your aws access is prepared such that dev container can have secure access to it. Assuming access for bloodconnect works from your cli; run the following command to create an env file from the project root.

 .. code-block:: bash

    printf "AWS_ACCESS_KEY_ID=%s\nAWS_SECRET_ACCESS_KEY=%s\nAWS_SESSION_TOKEN=%s" \
    $(aws sts assume-role \
    --role-arn arn:aws:iam::<bloodconnect aws account id>:role/GitHubActionsAndDevRole \
    --role-session-name <a random session name> \
    --query "Credentials.[AccessKeyId,SecretAccessKey,SessionToken]" \
    --output text) > .devcontainer/devcontainer.env

 .. warning::
    The above role is maintained in this repo: https://github.com/CraftsmenLtd/Bloodconnect-oidc

This will create a simple `.env` file with required aws environment variables. You might want to add any additional variables required by terraform here as well. Some might already have defaults set in our makefile. Examples of variable you might want to set:

 .. code-block:: env
    TF_BACKEND_BUCKET_NAME=terraform-bloodconnect-states
    TF_VAR_bloodconnect_domain=bloodconnect.net

Now that that is done; you can follow the screenshots below to start dev containers.
Click on the remote window icon on the bottom left of your vscode window.

 .. image:: ../assets/images/remote-dev.png
    :width: 600

Now from the options select Reopen in Container.

 .. image:: ../assets/images/remote-dev-2.png
    :width: 600

On first setup it might take awhile since it will build the image.
You may be asked to approve github fingerprint setup, please select yes so that you can use git from dev containers.

 .. image:: ../assets/images/remote-dev-3.png
    :width: 600

Now you are ready to run commands. Keep in mind that you are inside the dev container; meaning you can run almost all commands in our makefile except for those that need docker cli. Another thing to be aware of is that you can not run commands with the `run-command` prefix as you are already inside the container.

Prepare your code for deployment.

 .. code-block:: bash

    make prep-dev

This will install all packages, build all node lambdas and zip them for deployment. You can run this every time you've made changes and you want to deploy. Next you need to do the actual deployment.

 .. code-block:: bash

    make deploy-dev-branch

And thats it. You will have all the bells and whistle of your IDE without having to mess around with any binaries.

 .. warning::

    If your aws credentials expire, you'll need to update the `.devcontainer/devcontainer.env` file with the new credentials and rebuild container. This option is available in the bottom left corner of your IDE.

Container
^^^^^^^^^
This works very similar to how the previous setup works and our pipelines work the same way except for a few differences.

All commands except `start-dev` and `run-dev` must be prefixed with `run-command`. `run-command` essentially executes the make target inside our prebuilt development container.

Assuming you have aws access and localstack access, go ahead and run

 .. code-block:: bash

    export $(printf "AWS_ACCESS_KEY_ID=%s AWS_SECRET_ACCESS_KEY=%s AWS_SESSION_TOKEN=%s" \
    $(aws sts assume-role \
    --role-arn arn:aws:iam::<bloodconnect aws account id>:role/GitHubActionsAndDevRole \
    --role-session-name <a random session name> \
    --query "Credentials.[AccessKeyId,SecretAccessKey,SessionToken]" \
    --output text))
    
    export LOCALSTACK_AUTH_TOKEN=<your localstack auth token>

This will export the aws variables into your environment. 

 .. code-block:: bash
    
    make start-dev

Which will do everything required in order to get a fully working localstack deployment running. Every time you want to check your changes, you can just run

 .. code-block:: bash
    
    make run-dev

If you want to run a specific command from the makefile; use the `run-command` prefix. Note that this doesn't apply to `prep-dev`, `start-dev` `localstack-start` or `run-dev`.

If you want to deploy into aws with this method, you can still run:

 .. code-block:: bash

    make deploy-dev-branch

Pipeline
^^^^^^^^
The hassle free deployment strategy. Go onto github actions `<here> https://github.com/CraftsmenLtd/BloodConnect/actions/workflows/deploy-branch.yml`_. And do the following:

 .. image:: ../assets/images/branch-deploy.png
    :width: 600

Thats all for now. Have fun.
