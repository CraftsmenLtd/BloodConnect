locals {
  dynamodb_table_name = split("/", var.dynamodb_table_arn)[1]
  gsi1_arn            = "${var.dynamodb_table_arn}/index/GSI1"
}
