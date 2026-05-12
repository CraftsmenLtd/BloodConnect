Guideline
~~~~~~~~~
* Use ``camelCase`` for query parameters, api payloads and custom headers
* Use hyphen in API urls

OpenAPI Specs
~~~~~~~~~~~~~

.. raw:: html

   Check out the open api specs <a href="../openapi/api.html">HERE</a>. <br><br><br>

Architecture
~~~~~~~~~~~~

The OpenAPI spec is the single source of truth for the BloodConnect API. One bundled
spec drives three independent outputs:

1. **API Gateway provisioning** — Terraform imports the bundled spec as the body of
   ``aws_api_gateway_rest_api``. Routes, Cognito authorizer, Lambda integrations,
   request validators, and VTL templates are all configured from the spec.
2. **Public documentation site** — ``make sphinx-html`` includes the bundled spec
   in the generated docs.
3. **Live API testing** — Swagger UI (Docker) serves the bundled spec and hits the
   real deployed API Gateway with a valid Cognito ID token.

A CI lint step (Spectral) validates the bundled spec on every PR. Broken specs are
blocked at PR time rather than at deploy time.

File Layout
===========

The spec is split into small files under ``openapi/`` and assembled by Redocly::

   openapi/
   ├── versions/v1.json                  # root spec — entry point
   ├── paths/<resource>/*.json           # endpoint definitions ($ref'd from v1.json)
   ├── components/schemas/<resource>/    # JSON Schema for request/response models
   ├── integration/aws/
   │   ├── <resource>/*.json             # x-amazon-apigateway-integration blocks
   │   └── <resource>/vtl/
   │       ├── requestTemplates/*.vtl    # VTL request mapping templates
   │       └── responseTemplates/*.vtl   # VTL response mapping templates
   ├── validators.json                   # x-amazon-apigateway-request-validators
   ├── configs/
   │   ├── redocly.yaml                  # bundler config
   │   └── plugins/decorators/
   │       └── Inject-vtl-content.cjs    # custom decorator (inlines VTL)
   ├── .spectral.json                    # lint rules
   ├── Dockerfile, docker-compose.yml    # Swagger UI container
   └── swagger-ui/
       ├── setup-swagger.sh              # entry: bundle env + start container
       ├── generate-token.sh             # Cognito sign-up + IdToken capture
       ├── process-openapi.sh            # runtime sed for API_GATEWAY_ID
       ├── nginx.conf
       └── index.html                    # Swagger UI w/ Bearer token interceptor

Bundling Pipeline
=================

``redocly bundle`` walks the ``$ref`` graph starting at ``versions/v1.json`` and
emits a single self-contained spec file.

A custom Redocly decorator (``openapi/configs/plugins/decorators/Inject-vtl-content.cjs``)
inlines the contents of ``.vtl`` files at bundle time. AWS integration JSON files
use ``#importVtl`` markers:

.. code-block:: json

   "requestTemplates": {
     "application/json": "#importVtl donations/vtl/requestTemplates/post-donation.vtl"
   }

The decorator finds the marker on every ``Operation``, reads the referenced
``.vtl`` file, and replaces the marker with the raw VTL content. This keeps VTL
files editable as ``.vtl`` (with proper syntax highlighting and no JSON escaping)
while still shipping a single self-contained spec for API Gateway import.

Run the bundle manually:

.. code-block:: sh

   make bundle-openapi

Output: ``docs/openapi/v1.json``.

AWS Extensions
==============

The spec uses AWS-specific OpenAPI extensions to fully describe each endpoint:

- ``x-amazon-apigateway-authorizer`` (in ``securitySchemes``) — Cognito user pool
  binding. The user pool ARN is substituted at deploy time via ``${USER_POOL_ARN}``.
- ``x-amazon-apigateway-integration`` (per operation) — Lambda integration target,
  request/response templates, passthrough behavior. The Lambda invoke ARN is
  substituted via ``${<LAMBDA>_INVOCATION_ARN}``.
- ``x-amazon-apigateway-request-validator`` (per operation) — references a
  validator (e.g. ``ValidateBodyAndQuery``) defined in ``validators.json``.
- ``x-amazon-apigateway-request-validators`` (root level) — validator definitions
  pulled in via ``$ref`` from ``validators.json``.

Terraform Integration
=====================

``iac/terraform/aws/openapi.tf`` orchestrates the bundle and prepares it for API
Gateway import:

1. ``null_resource.update_and_import_open_api_script`` runs ``redocly bundle``.
   The trigger is a ``sha1`` over every file under ``openapi/``, so the bundle
   only re-runs when something actually changed.
2. ``data.template_file.openapi_definition`` reads the bundled file and
   substitutes placeholders (``${USER_POOL_ARN}``, ``${API_GATEWAY_DYNAMODB_ROLE}``,
   all Lambda invoke ARNs from ``local.all_lambda_invoke_arns``).
3. ``aws_api_gateway_rest_api.body`` is set to the rendered spec
   (``iac/terraform/aws/api_gw.tf``). API Gateway imports the entire definition —
   routes, authorizer, integrations, validators, VTL — in a single field.

CI Lint Gate
============

The first step of ``ci-checks.yml`` runs:

.. code-block:: sh

   make lint-api

Which runs:

.. code-block:: sh

   redocly bundle openapi/versions/v1.json -o docs/openapi/v1.json --config openapi/configs/redocly.yaml
   spectral lint docs/openapi/v1.json --ruleset openapi/.spectral.json

Spectral lints the **bundled** file, not the source. This catches errors that only
appear after ``$ref`` resolution — broken schema references, missing descriptions
on shared operations, mismatched tags. The active ruleset extends ``spectral:oas``
with project-specific overrides in ``openapi/.spectral.json``.

A broken spec fails the PR before terraform ever attempts an import.

API Client (Swagger UI)
~~~~~~~~~~~~~~~~~~~~~~~
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
- The Cognito user is reused on subsequent runs; only the first call performs the
  sign-up step.

Adding a New Endpoint
~~~~~~~~~~~~~~~~~~~~~

The minimum set of files to add a new endpoint:

1. **Path file** — ``openapi/paths/<resource>/<endpoint>.json``. Defines HTTP
   methods, request body schema reference, response shape, security, and the
   integration ``$ref``. Add an entry under ``paths`` in
   ``openapi/versions/v1.json``.
2. **Schema file** (if the endpoint has a request body) —
   ``openapi/components/schemas/<resource>/<payload>.json``. Plain JSON Schema
   with ``required``, ``properties``, and an ``example``.
3. **AWS integration file** — ``openapi/integration/aws/<resource>/<endpoint>.json``.
   Sets the Lambda invoke ARN placeholder, request/response templates (using
   ``#importVtl`` markers), and CORS response headers.
4. **VTL templates** — ``openapi/integration/aws/<resource>/vtl/requestTemplates/``
   and ``responseTemplates/``. Map API Gateway input to Lambda event and back.
   Cognito claims are available as ``$context.authorizer.claims['custom:userId']``.
5. **Lambda ARN variable** — Add the placeholder
   (e.g. ``${MY_NEW_LAMBDA_INVOCATION_ARN}``) to ``local.all_lambda_invoke_arns``
   in the Terraform configuration so ``template_file`` can substitute it.

Run ``make lint-api`` locally before pushing to catch spec errors early.
