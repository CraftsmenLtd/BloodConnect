locals {
  lambda_archive_path = "${path.module}/../../../../core/services/aws/.build/zips"
  lambda_build_path   = "${path.module}/../../../../core/services/aws/.build"
  all_js_files = fileset(local.lambda_build_path, "**/*.js")
  matching_files = [for f in local.all_js_files : f if endswith(f, var.lambda_option.js_file_name)]
  lambda_file = length(local.matching_files) > 0 ? local.matching_files[0] : ""
  lambda_file_path = "${local.lambda_build_path}/${local.lambda_file}"
}
