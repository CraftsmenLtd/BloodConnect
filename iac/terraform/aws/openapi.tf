resource "null_resource" "update_and_import_open_api_script" {
  provisioner "local-exec" {
    command = "redocly bundle ${var.openapi_directory}/versions/${var.api_version}.json -o ${var.combined_openapi_file}"
  }

  triggers = {
    always_run = timestamp()
  }
}

data "template_file" "openapi_definition" {
  template = file(var.combined_openapi_file)

  vars = merge({
    ENVIRONMENT = var.environment
    API_VERSION = var.api_version
    },
    local.all_lambda_invoke_arns
  )

  depends_on = [
    null_resource.update_and_import_open_api_script
  ]
}
