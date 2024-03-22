data "aws_iam_policy_document" "lambda_assume_role_policy" {
  version = "2012-10-17"

  statement {
    sid     = "LambdaAssume"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_common_policy" {
  version = "2012-10-17"

  statement {
    sid = "LogPolicy"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]

    resources = [
      "arn:aws:logs:*:*:*"
    ]
  }
}
