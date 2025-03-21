Guideline
~~~~~~~~~
* Use `camelCase` for query parameters, api payloads and custom headers
* Use hyphen in API urls

OpenAPI Specs
~~~~~~~~~~~~~

.. raw:: html

   Check out the open api specs <a href="../openapi/api.html">HERE</a>. <br><br><br>

API Client(Swagger UI)
~~~~~~~~~~~~~~~~~~~~~~
Swagger UI has been integrated to automate API testing for branch or environment deployments. This allows testing the API endpoints with authentication.

Running Swagger UI
==================
To start Swagger UI with authentication, use the following command:

.. code-block:: sh

   make swagger-ui email=<email> password=<password> branch=<branch_name>

Parameters
----------
- ``branch`` - The deployed branch name or ``stage`` or ``production``.
- ``email`` - The email address for authentication.
- ``password`` - The password for authentication.

How It Works
============
1. The script creates a user in the Cognito User Pool using the provided email and password.
2. It retrieves the **IdToken** after successful authentication.
3. Swagger UI is configured with the necessary authentication token and API url.
4. Swagger UI launches, allowing interaction with the API endpoints.

Accessing Swagger UI
====================
Once Swagger UI is running, open a web browser and go to:

.. code-block:: text

   http://localhost:8080/

From there, you can use the Swagger UI interface to test the API endpoints.

Example Usage
=============
To test APIs on a deployed branch ``feature-xyz``, run:

.. code-block:: sh

   make swagger-ui email=user@example.com password=SecurePass123 branch=feature-xyz

For the stage environment:

.. code-block:: sh

   make swagger-ui email=admin@example.com password=ProdPass123 branch=stage

Notes
=====
- The authentication token is valid for a limited period; rerun the command if it expires.
- API Gateway updates must be correctly deployed for the specified branch or environment.
