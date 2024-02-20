data "aws_iam_policy_document" "api_gw_assume_role_policy" {
  version = "2012-10-17"

  statement {
    sid     = "ApiGwAssume"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_api_gw_invoke_policy" {
  version = "2012-10-17"

  statement {
    sid = "LambdaInvokePolicy"
    actions = [
      "lambda:InvokeFunction"
    ]

    resources = [
      var.lambda_function_arn
    ]
  }
}
