resource "aws_dynamodb_table" "blood_connect_data" {
  #checkov:skip=CKV_AWS_28: "Ensure Dynamodb point in time recovery (backup) is enabled"
  #checkov:skip=CKV_AWS_119: "Ensure DynamoDB Tables are encrypted using a KMS Customer Managed CMK"
  name         = "${var.environment}-bloodConnect-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  # GSI attributes
  attribute {
    name = "gsiPk"
    type = "S"
  }

  attribute {
    name = "gsiSk"
    type = "S"
  }

  # Adding the GSI
  global_secondary_index {
    name            = "gsi-index"
    hash_key        = "gsiPk"
    range_key       = "gsiSk"
    projection_type = "ALL"
  }
}
