data "aws_iam_policy_document" "lambda_kms_policy" {
  version = "2012-10-17"

  statement {
    sid       = "LambdaKmsPolicy"
    actions   = ["kms:*"]
    resources = ["arn:aws:kms:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:key/*"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
  }
}


resource "aws_kms_key" "lambda_env_var_kms" {
  description         = "KMS key for lambda environment variables"
  enable_key_rotation = true
  policy              = data.aws_iam_policy_document.lambda_kms_policy.json

  lifecycle {
    create_before_destroy = true
  }
}
