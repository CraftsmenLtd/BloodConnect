resource "null_resource" "run_update_methods_integrations_script" {
  provisioner "local-exec" {
    environment = {
      OPENAPI_DIRECTORY = var.openapi_files_path
      API_VERSION       = var.openapi_version
      CLOUD_PROVIDER    = "aws"
    }
    command = "${path.module}/scripts/updateOpenApiIntegrations.sh"
  }

  depends_on = [
    aws_api_gateway_rest_api.rest_api
  ]

  triggers = {
    always_run = "${timestamp()}"
  }
}

resource "null_resource" "run_prep_openapi_script" {
  provisioner "local-exec" {
    environment = {
      ACCOUNT_ID          = data.aws_caller_identity.current.account_id
      AWS_REGION          = data.aws_region.current.name
      ENVIRONMENT         = var.environment
      API_GATEWAY_ID      = aws_api_gateway_rest_api.rest_api.id
      OPENAPI_FILE        = "${var.openapi_files_path}/versions/${var.openapi_version}.yml"
      MERGED_OPENAPI_FILE = var.merged_openapi_file_name
      API_VERSION         = var.openapi_version
    }
    command = "${path.module}/scripts/prepOpenApi.sh"
  }

  depends_on = [
    aws_api_gateway_rest_api.rest_api,
    null_resource.run_update_methods_integrations_script
  ]

  triggers = {
    always_run = "${timestamp()}"
  }
}

resource "null_resource" "run_import_open_api_script" {
  provisioner "local-exec" {
    environment = {
      ACCOUNT_ID          = data.aws_caller_identity.current.account_id
      AWS_REGION          = data.aws_region.current.name
      ENVIRONMENT         = var.environment
      API_GATEWAY_ID      = aws_api_gateway_rest_api.rest_api.id
      MERGED_OPENAPI_FILE = var.merged_openapi_file_name
    }
    command = "${path.module}/scripts/importOpenApi.sh"
  }

  depends_on = [
    null_resource.run_prep_openapi_script
  ]

  triggers = {
    always_run = "${timestamp()}"
  }
}
