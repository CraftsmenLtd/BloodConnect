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
  "requestedBloodGroup": "<$.dynamodb.NewImage.requestedBloodGroup.S>",
  "bloodQuantity": "<$.dynamodb.NewImage.bloodQuantity.N>",
  "countryCode": "<$.dynamodb.NewImage.countryCode.S>",
  "urgencyLevel": "<$.dynamodb.NewImage.urgencyLevel.S>",
  "createdAt": "<$.dynamodb.NewImage.createdAt.S>",
  "geohash": "<$.dynamodb.NewImage.geohash.S>",
  "location": "<$.dynamodb.NewImage.location.S>",
  "donationDateTime": "<$.dynamodb.NewImage.donationDateTime.S>",
  "patientName": "<$.dynamodb.NewImage.patientName.S>",
  "seekerName": "<$.dynamodb.NewImage.seekerName.S>",
  "status": "<$.dynamodb.NewImage.status.S>",
  "contactNumber": "<$.dynamodb.NewImage.contactNumber.S>",
  "shortDescription": "<$.dynamodb.NewImage.shortDescription.S>",
  "transportationInfo": "<$.dynamodb.NewImage.transportationInfo.S>"
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
      starting_position = "LATEST"
      batch_size        = 1
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
      starting_position = "LATEST"
      batch_size        = 1
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

resource "aws_pipes_pipe" "donation_request_monitoring_pipe" {
  name     = "${var.environment}-donation-request-monitoring-pipe"
  role_arn = aws_iam_role.eventbridge_pipe_role.arn
  source   = var.dynamodb_table_stream_arn
  target   = var.monitor_donation_request_lambda_arn

  source_parameters {
    dynamodb_stream_parameters {
      starting_position = "LATEST"
      batch_size        = 5
    }

    filter_criteria {
      filter {
        pattern = jsonencode({
          "eventName" : ["INSERT"],
          "dynamodb" : {
            "NewImage" : {
              "PK" : { "S" : [{ "prefix" : "BLOOD_REQ#" }] },
              "SK" : { "S" : [{ "prefix" : "BLOOD_REQ#" }] }
            }
          }
        })
      }
    }
  }

  target_parameters {
    input_template = <<EOF
{
  "requestedBloodGroup": "<$.dynamodb.NewImage.requestedBloodGroup.S>",
  "geohash": "<$.dynamodb.NewImage.geohash.S>"
}
EOF
  }

  log_configuration {
    include_execution_data = ["ALL"]
    level                  = "INFO"
    cloudwatch_logs_log_destination {
      log_group_arn = aws_cloudwatch_log_group.donation_request_monitoring_pipe_log_group.arn
    }
  }

  depends_on = [aws_iam_role_policy.eventbridge_pipe_policy]
}
