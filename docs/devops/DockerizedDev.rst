==================================
Dockerized Development Environment
==================================
From `wikipedia <https://en.wikipedia.org/wiki/Docker_(software)>`_, `Docker <https://www.docker.com/>`_ is a set of platform as a service (PaaS) products that use OS-level virtualization to deliver software in packages called containers.

Dockerized development environment is a project development environment for devs where only docker (and IDE) is installed and all other project dependencies is resolved by Docker.
In this project, it is going to be used and `Dockerfile` in project root dir is being used.

.. literalinclude:: ../../Dockerfile

Library versions are provided as docker ARG e.g TERRAFORM_VERSION, NODE_MAJOR.

For the solution, `Development Containers <https://containers.dev/>`_ is being used. Both Visual Studio Code and IntelliJ IDEs has `support <https://containers.dev/supporting>`_ of Development Containers.

Setup JetBrains IDE
~~~~~~~~~~~~~~~~~~~
This `GUIDE <https://www.jetbrains.com/help/idea/connect-to-devcontainer.html#new_container>`_ includes dockerized development environment setup of JetBrains IDEs like WebStorm, IntelliJ IDEA, PyCharm etc.

.. |container-ico| image:: ../assets/images/dockerize-intellij-icon.png

- Right click on the project name in `Project` view and select New>.devcontainer
- In the popup panel, select `Existing Dockerfile` from `Dev Container Template` dropdown and click `OK`
- It will create a `.devcontainer` directory in the project root and there will be a `devcontainer.json` file
- The `devcontainer.json` file contains all of the dockerized development configurations
- The above steps are only one time setup
- Now, in the left gutter, click |container-ico| Create Dev Container and select Create Dev Container and Mount Sources to build your Dev Container.