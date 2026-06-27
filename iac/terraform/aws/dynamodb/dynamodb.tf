resource "aws_dynamodb_table" "blood_connect_data" {
  #checkov:skip=CKV_AWS_28: "Ensure Dynamodb point in time recovery (backup) is enabled"
  #checkov:skip=CKV_AWS_119: "Ensure DynamoDB Tables are encrypted using a KMS Customer Managed CMK"
  name             = "${var.environment}-bloodConnect-table"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "PK"
  range_key        = "SK"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "LSI1SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  local_secondary_index {
    name            = "LSI1"
    range_key       = "LSI1SK"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  # Per-item TTL: only items that set the "expiresAt" epoch attribute are purged
  # (e.g. chat messages, ws-connection records). Existing entities never set it,
  # so they are never expired. See REQ-001 (in-app chat) architecture, Risks.
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }
}
