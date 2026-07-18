# EventBridge pipes drive the chat channel lifecycle off the DynamoDB stream, mirroring the
# donation accept/ignore pipes: INSERT of an ACCEPTED# record opens a channel, REMOVE locks it.

data "aws_iam_policy_document" "chat_pipe_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["pipes.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "chat_pipe_role" {
  name               = "${var.environment}-chat-pipe-role"
  assume_role_policy = data.aws_iam_policy_document.chat_pipe_assume_role.json
}

data "aws_iam_policy_document" "chat_pipe_policy_doc" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams"
    ]
    resources = [var.dynamodb_table_stream_arn]
  }
  statement {
    effect  = "Allow"
    actions = ["lambda:InvokeFunction"]
    resources = [
      module.lambda["chat-channel-creator"].lambda_arn,
      module.lambda["chat-channel-locker"].lambda_arn
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "${aws_cloudwatch_log_group.chat_channel_create_pipe.arn}:*",
      "${aws_cloudwatch_log_group.chat_channel_lock_pipe.arn}:*"
    ]
  }
}

resource "aws_iam_role_policy" "chat_pipe_policy" {
  name   = "${var.environment}-chat-pipe-policy"
  role   = aws_iam_role.chat_pipe_role.id
  policy = data.aws_iam_policy_document.chat_pipe_policy_doc.json
}

resource "aws_cloudwatch_log_group" "chat_channel_create_pipe" {
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "/aws/vendedlogs/pipes/${var.environment}-chat-channel-create-pipe"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "chat_channel_lock_pipe" {
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "/aws/vendedlogs/pipes/${var.environment}-chat-channel-lock-pipe"
  retention_in_days = 30
}

# Creation pipe: INSERT of an ACCEPTED# record -> open (or re-open) the donor's chat channel.
resource "aws_pipes_pipe" "chat_channel_create_pipe" {
  name     = "${var.environment}-chat-channel-create-pipe"
  role_arn = aws_iam_role.chat_pipe_role.arn
  source   = var.dynamodb_table_stream_arn
  target   = module.lambda["chat-channel-creator"].lambda_arn

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
      log_group_arn = aws_cloudwatch_log_group.chat_channel_create_pipe.arn
    }
  }

  depends_on = [aws_iam_role_policy.chat_pipe_policy]
}

# Lock pipe: REMOVE of an ACCEPTED# record (IGNORED) -> lock the donor's chat channel.
resource "aws_pipes_pipe" "chat_channel_lock_pipe" {
  name     = "${var.environment}-chat-channel-lock-pipe"
  role_arn = aws_iam_role.chat_pipe_role.arn
  source   = var.dynamodb_table_stream_arn
  target   = module.lambda["chat-channel-locker"].lambda_arn

  source_parameters {
    dynamodb_stream_parameters {
      starting_position             = "LATEST"
      batch_size                    = 1
      maximum_record_age_in_seconds = -1
    }

    filter_criteria {
      filter {
        pattern = jsonencode({
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
      log_group_arn = aws_cloudwatch_log_group.chat_channel_lock_pipe.arn
    }
  }

  depends_on = [aws_iam_role_policy.chat_pipe_policy]
}

resource "aws_lambda_permission" "allow_create_pipe_invoke_creator" {
  statement_id  = "AllowExecutionFromChatCreatePipe"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda["chat-channel-creator"].lambda_function_name
  principal     = "pipes.amazonaws.com"
  source_arn    = aws_pipes_pipe.chat_channel_create_pipe.arn
}

resource "aws_lambda_permission" "allow_lock_pipe_invoke_locker" {
  statement_id  = "AllowExecutionFromChatLockPipe"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda["chat-channel-locker"].lambda_function_name
  principal     = "pipes.amazonaws.com"
  source_arn    = aws_pipes_pipe.chat_channel_lock_pipe.arn
}
