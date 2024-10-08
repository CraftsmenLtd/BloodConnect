data "aws_iam_policy_document" "api_gw_policy" {
  version = "2012-10-17"

  statement {
    sid    = "ApiGwPolicy"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}
