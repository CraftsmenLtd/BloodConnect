resource "null_resource" "update_and_import_open_api_script" {
  provisioner "local-exec" {
    command = "redocly bundle ${var.openapi_directory}/versions/${var.api_version}.json -o ${var.combined_openapi_file} --config ${var.openapi_directory}/configs/redocly.yaml"
  }

  triggers = {
    directory_md5 = sha1(join("", [for f in fileset(var.openapi_directory, "**") : filesha1("${var.openapi_directory}/${f}")]))
  }
}

data "template_file" "openapi_definition" {
  template = file(var.combined_openapi_file)

  vars = merge({
    ENVIRONMENT               = var.environment
    API_VERSION               = var.api_version
    AWS_REGION                = data.aws_region.current.name
    DYNAMODB_TABLE_NAME       = split("/", module.database.dynamodb_table_arn)[1]
    USER_POOL_ARN             = module.cognito.user_pool_arn
    API_GATEWAY_DYNAMODB_ROLE = aws_iam_role.api_gw_role.arn
    },
    local.all_lambda_invoke_arns
  )

  depends_on = [
    null_resource.update_and_import_open_api_script
  ]
}
