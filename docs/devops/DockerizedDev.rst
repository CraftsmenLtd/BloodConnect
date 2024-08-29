==================================
Dockerized Development Environment
==================================
From `wikipedia <https://en.wikipedia.org/wiki/Docker_(software)>`_, `Docker <https://www.docker.com/>`_ is a set of platform as a service (PaaS) products that use OS-level virtualization to deliver software in packages called containers.

Dockerized development environment is a project development environment for devs where only docker (and IDE) is installed and all other project dependencies is resolved by Docker.
In this project, it is going to be used and `Dockerfile` in project root dir is being used.

.. literalinclude:: ../../Dockerfile

Library versions are provided as docker ARG e.g TERRAFORM_VERSION, NODE_MAJOR. A lightweight debian docker image is being used.

Setup JetBrains IDE
~~~~~~~~~~~~~~~~~~~
This guide includes dockerized development environment setup of JetBrains IDEs like WebStorm, IntelliJ IDEA, PyCharm etc.
