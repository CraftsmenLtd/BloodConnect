=============================================
Lambda Functions and Integrating With OpenAPI
=============================================
This guide combines two processes: creating a Terraform module that defines and deploys multiple AWS Lambda functions with their associated IAM policies, and integrating those Lambda functions into an OpenAPI specification. We'll use **test** as a sample module for defining Lambda functions, and demonstrate how to add a new ``test-api`` Lambda function to the OpenAPI specification using API Gateway for integration.

Part 1: Create a module with lambda functions
=============================================

1. **Module File Structure**

Create a Terraform module with the following structure to define Lambda functions and their associated IAM policies:

.. code-block:: bash

    test/
    ├── lambdas.tf    # Defines Lambda function configurations
    ├── modules.tf    # Uses the Lambda module to deploy Lambda functions
    ├── policies.tf   # Defines reusable IAM policies for the Lambda functions
    ├── outputs.tf    # Exports metadata of the created Lambda functions
    ├── data.tf       # Retrieves AWS identity and region data
    ├── variables.tf  # Defines variables used in the module

2. **Defining Lambda Function Options**

In ``lambdas.tf``, configure the settings for each Lambda function, such as the handler, zip file path, environment variables, and IAM policies.

.. code-block::

    locals {
      lambda_options = {
        function-one = {
          name                       = "function-one"
          handler                    = "functionOne.default"
          zip_path                   = "${var.lambda_archive_path}/functionOne.zip"
          statement                  = local.policies.common_policies
          invocation_arn_placeholder = "FUNCTION_ONE_INVOCATION_ARN"   # Placeholder for OpenAPI integration
          env_variables = {
            foo = "bar"
          }
        }
        function-two = {
          name                       = "function-two"
          handler                    = "functionTwo.default"
          zip_path                   = "${var.lambda_archive_path}/functionTwo.zip"
          statement                  = local.policies.common_policies
          invocation_arn_placeholder = "FUNCTION_TWO_INVOCATION_ARN"
          env_variables              = {}
        }
      }
    }

Explanation:

- ``lambda_options``: Defines each Lambda function's configuration including:

  - ``name``: Lambda function name.
  - ``handler``: Lambda function entry point.
  - ``zip_path``: Path to the Lambda zip file.
  - ``statement``: Associated IAM policies (defined in ``policies.tf``).
  - ``env_variables``: Custom environment variables for each function.
  - ``invocation_arn_placeholder``: Placeholder for integrating with OpenAPI.


3. **Defining IAM Policies**

In ``policies.tf``, define reusable IAM policies that will be attached to the Lambda functions. For instance, a common policy to enable logging.

.. code-block::

    locals {
      policies = {
        common_policies = [
          {
            sid = "LogPolicy"
            actions = [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams"
            ]
            resources = [
              "arn:aws:logs:*:*:*"
            ]
          }
        ]
      }
    }

4. **Creating the Lambda Functions Using the Module**

In ``modules.tf``, use the ``for_each`` loop to create multiple Lambda functions based on the configuration in ``lambda_options``.

.. code-block::

    module "lambda" {
      for_each      = local.lambda_options
      source        = "./../lambda"  # Reference to the existing Lambda module
      environment   = var.environment
      lambda_option = each.value
    }

5. **Exporting Lambda Function Metadata**

In ``outputs.tf``, export the metadata for the created Lambda functions, such as their names and ARNs. This is particularly useful when integrating the Lambda functions with services (e.g., OpenAPI).

.. code-block::

    output "lambda_metadata" {
      value = [
        for option in local.lambda_options : {
          lambda_function_name       = module.lambda[option.name].lambda_function_name
          lambda_invoke_arn          = module.lambda[option.name].lambda_invoke_arn
          invocation_arn_placeholder = option.invocation_arn_placeholder
        }
      ]
    }

6. **Retrieving AWS Identity and Region Data**

.. code-block::

    data "aws_caller_identity" "current" {}

    data "aws_region" "current" {}

7. **Defining Module Variables**

In ``variables.tf``, define the necessary variables for the module, such as ``environment`` and the path to the Lambda archive files.

.. code-block::

    variable "environment" {
      type        = string
      description = "Deployment environment (e.g., dev, stage, prod)"
    }

    variable "lambda_archive_path" {
      type        = string
      description = "Path to the directory where Lambda zip files are stored"
    }

8. **Updating the Root Module Metadata**

In the root ``local.tf``, update the metadata for all Lambda functions by adding the new module’s outputs.

.. code-block::

    locals {
      all_lambda_metadata = concat(
        module.auth.lambda_metadata,
        module.test.lambda_metadata  # Add new module metadata here
      )
    }


Part 2: Integrating Lambda with OpenAPI
=======================================

After deploying the Lambda functions, you can integrate them into your OpenAPI specification using API Gateway.

1. **OpenAPI File Structure Overview**

.. code-block:: bash

    openapi/
    ├── versions/
    │   └── v1.json                       # Main OpenAPI configuration
    ├── paths/
    │   └── test/
    │       └── test-api.json              # New path for the test Lambda function
    ├── components/
    │   └── schemas/
    │       └── test/
    │           └── test-api-payload.json  # Request payload schema for test-api
    ├── integration/
    │   └── aws/
    │       └── test/
    │           └── post-test-api.json     # Integration for test-api with Lambda

2. **Defining the New API Path**

To add a new ``POST`` method for the ``test-api``, create a new path definition file under the ``paths/test/`` directory. This defines the ``POST /test/test-api`` endpoint, its request body schema, response headers, and links it to the Lambda integration in the ``integration/aws/test/post-test-api.json`` file.

File: ``openapi/paths/test/test-api.json``

.. code-block:: json

    {
      "post": {
        "operationId": "TestAPI",
        "description": "Test API for demonstration",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "./../../components/schemas/test/test-api-payload.json#/TestAPIRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "200 response",
            "headers": {
              "Access-Control-Allow-Origin": {
                "schema": {
                  "type": "string"
                }
              },
              "Access-Control-Allow-Methods": {
                "schema": {
                  "type": "string"
                }
              },
              "Access-Control-Allow-Headers": {
                "schema": {
                  "type": "string"
                }
              }
            },
            "content": {}
          }
        },
        "x-amazon-apigateway-request-validator": "ValidateBodyAndQuery",
        "x-amazon-apigateway-integration": {
          "$ref": "./../../integration/aws/test/post-test-api.json"
        },
        "security": [
          {
            "BearerAuth": []
          }
        ]
      },
      "options": {
        "$ref": "./../cors-options.json"
      }
    }

3. **Adding Request Payload Schema**

To define the request payload structure for the ``test-api``, create a new schema file in ``components/schemas/test/``.

File: ``openapi/components/schemas/test/test-api-payload.json``

.. code-block:: json

    {
      "TestAPIRequest": {
        "type": "object",
        "required": [
          "testField"
        ],
        "properties": {
          "testField": {
            "type": "string"
          }
        },
        "example": {
          "testField": "example value"
        }
      }
    }

Explanation:
- **TestAPIRequest**: Specifies the request body schema, with a required ``testField`` of type ``string``. 
- **Example**: Provides an example request body.

4. **Lambda Integration with API Gateway**

To link the ``POST`` method to the Lambda function, define the API Gateway integration configuration in the ``integration/aws/test/`` directory.

File: ``openapi/integration/aws/test/post-test-api.json``

.. code-block:: json

    {
      "type": "aws",
      "httpMethod": "POST",
      "uri": "${TEST_API_INVOCATION_ARN}",
      "responses": {
        "default": {
          "statusCode": "200",
          "responseParameters": {
            "method.response.header.Access-Control-Allow-Methods": "'POST'",
            "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            "method.response.header.Access-Control-Allow-Origin": "'*'"
          },
          "responseTemplates": {
            "application/json": "#set($inputRoot = $input.path('$'))\n#set($context.responseOverride.status = $inputRoot.statusCode)\n$inputRoot.body"
          }
        }
      },
      "requestTemplates": {
        "application/json": "#set($inputRoot = $input.path('$'))\n{\n  \"testField\": \"$inputRoot.testField\"\n}"
      },
      "passthroughBehavior": "never"
    }

Explanation:

- **uri**: Uses the Lambda function ARN placeholder (`TEST_API_INVOCATION_ARN`), which will be replaced with the actual ARN of your Lambda function during deployment.
- **Response mapping**: Defines how responses are handled, including setting status codes and headers.
- **Request mapping**: Transforms the incoming request to the format required by the Lambda function. The transformation is done using Velocity Template Language (VTL). For more details read this `VTL <https://docs.aws.amazon.com/apigateway/latest/developerguide/models-mappings.html>`_ documentation.

5. **Referencing the New API Path in the OpenAPI Spec**

Finally, update the main OpenAPI spec file (``versions/v1.json``) to include the new ``test-api``` path.

File: ``openapi/versions/v1.json``

.. code-block::

    {
      "openapi": "3.0.1",
      "paths": {
        "/test/test-api": {
          "$ref": "./../paths/test/test-api.json"
        }
      }
    }
