resource "null_resource" "update_and_import_open_api_script" {
  provisioner "local-exec" {
    command = "redocly bundle ${var.openapi_directory}/versions/${var.api_version}.json -o ${var.combined_openapi_file}"
  }

  triggers = {
    directory_md5 = sha1(join("", [for f in fileset(var.openapi_directory, "**"): filesha1("${var.openapi_directory}/${f}")])) 
  }
}

data "template_file" "openapi_definition" {
  template = file(var.combined_openapi_file)

  vars = merge({
    ENVIRONMENT   = var.environment
    API_VERSION   = var.api_version
    USER_POOL_ARN = module.cognito.user_pool_arn
    },
    local.all_lambda_invoke_arns
  )

  depends_on = [
    null_resource.update_and_import_open_api_script
  ]
}
