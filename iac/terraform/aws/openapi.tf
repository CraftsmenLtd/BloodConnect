resource "null_resource" "update_and_import_open_api_script" {
  provisioner "local-exec" {
    command = "redocly bundle ${var.openapi_directory}/versions/${var.api_version}.json -o ${var.combined_openapi_file}"
  }

  triggers = {
    always_run = timestamp()
  }
}
