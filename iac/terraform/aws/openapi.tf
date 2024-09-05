resource "null_resource" "run_update_and_import_open_api_script" {
  provisioner "local-exec" {
    command = "redocly bundle ${var.openapi_directory}/versions/${var.openapi_version}.json -o ${var.combined_openapi_file}"
  }

  triggers = {
    always_run = "${timestamp()}"
  }
}

locals {
  all_lambda_invoke_arns = merge(
    module.auth.lambda_invoke_arns
  )
}

data "template_file" "openapi_definition" {
  template = file(var.combined_openapi_file)

  vars = merge({
    ENVIRONMENT = var.environment
    API_VERSION = var.openapi_version
    },
    local.all_lambda_invoke_arns
  )

  depends_on = [
    null_resource.run_update_and_import_open_api_script
  ]
}

resource "local_file" "openapi_output" {
  filename = var.combined_openapi_file
  content  = data.template_file.openapi_definition.rendered
  depends_on = [
    null_resource.run_update_and_import_open_api_script
  ]
}
