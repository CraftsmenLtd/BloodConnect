resource "aws_pipes_pipe" "donation_request_pipe" {
  name     = "${var.environment}-donation-request-pipe"
  role_arn = aws_iam_role.eventbridge_pipe_role.arn
  source   = var.dynamodb_table_stream_arn
  target   = var.donation_request_queue_arn

  source_parameters {
    dynamodb_stream_parameters {
      starting_position             = "LATEST"
      batch_size                    = 5
      maximum_record_age_in_seconds = -1
    }

    filter_criteria {
      filter {
        pattern = jsonencode({
          "eventName" : ["INSERT", "MODIFY"],
          "dynamodb" : {
            "NewImage" : {
              "PK" : { "S" : [{ "prefix" : "BLOOD_REQ#" }] },
              "SK" : { "S" : [{ "prefix" : "BLOOD_REQ#" }] },
              "status" : { "S" : ["PENDING"] }
            }
          }
        })
      }
    }
  }

  target_parameters {
    input_template = <<EOF
{
  "PK": "<$.dynamodb.NewImage.PK.S>",
  "SK": "<$.dynamodb.NewImage.SK.S>",
  "geohash": "<$.dynamodb.NewImage.geohash.S>",
  "status": "<$.dynamodb.NewImage.status.S>"
}
EOF
  }

  log_configuration {
    include_execution_data = ["ALL"]
    level                  = "INFO"
    cloudwatch_logs_log_destination {
      log_group_arn = aws_cloudwatch_log_group.donation_request_pipe_log_group.arn
    }
  }

  depends_on = [aws_iam_role_policy.eventbridge_pipe_policy]
}


resource "aws_pipes_pipe" "donation_accept_pipe" {
  name     = "${var.environment}-donation-accept-pipe"
  role_arn = aws_iam_role.eventbridge_pipe_role.arn
  source   = var.dynamodb_table_stream_arn
  target   = var.donation_status_manager_queue_arn

  source_parameters {
    dynamodb_stream_parameters {
      starting_position             = "LATEST"
      batch_size                    = 1
      maximum_record_age_in_seconds = -1
    }

    filter_criteria {
      filter {
        pattern = jsonencode({
          "eventName" : ["INSERT"],
          "dynamodb" : {
            "NewImage" : {
              "PK" : { "S" : [{ "prefix" : "BLOOD_REQ#" }] },
              "SK" : { "S" : [{ "prefix" : "ACCEPTED#" }] }
            }
          }
        })
      }
    }
  }

  target_parameters {
    input_template = <<EOF
{
  "PK": "<$.dynamodb.NewImage.PK.S>",
  "SK": "<$.dynamodb.NewImage.SK.S>",
  "createdAt": "<$.dynamodb.NewImage.createdAt.S>"
}
EOF
  }

  log_configuration {
    include_execution_data = ["ALL"]
    level                  = "INFO"
    cloudwatch_logs_log_destination {
      log_group_arn = aws_cloudwatch_log_group.donation_accept_pipe_log_group.arn
    }
  }

  depends_on = [aws_iam_role_policy.eventbridge_pipe_policy]
}


resource "aws_pipes_pipe" "donation_ignore_pipe" {
  name     = "${var.environment}-donation-ignore-pipe"
  role_arn = aws_iam_role.eventbridge_pipe_role.arn
  source   = var.dynamodb_table_stream_arn
  target   = var.donation_status_manager_queue_arn

  source_parameters {
    dynamodb_stream_parameters {
      starting_position             = "LATEST"
      batch_size                    = 1
      maximum_record_age_in_seconds = -1
    }

    filter_criteria {
      filter {
        pattern = jsonencode(
          {
            "eventName" : ["REMOVE"],
            "dynamodb" : {
              "OldImage" : {
                "PK" : { "S" : [{ "prefix" : "BLOOD_REQ#" }] },
                "SK" : { "S" : [{ "prefix" : "ACCEPTED#" }] }
              }
            }
        })
      }
    }
  }

  target_parameters {
    input_template = <<EOF
{
  "PK": "<$.dynamodb.OldImage.PK.S>",
  "SK": "<$.dynamodb.OldImage.SK.S>",
  "createdAt": "<$.dynamodb.OldImage.createdAt.S>"
}
EOF
  }

  log_configuration {
    include_execution_data = ["ALL"]
    level                  = "INFO"
    cloudwatch_logs_log_destination {
      log_group_arn = aws_cloudwatch_log_group.donation_accept_pipe_log_group.arn
    }
  }

  depends_on = [aws_iam_role_policy.eventbridge_pipe_policy]
}
