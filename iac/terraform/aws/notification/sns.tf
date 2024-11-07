resource "aws_sns_topic" "push_notification" {
  #checkov:skip=CKV_AWS_26: "Ensure all data stored in the SNS topic is encrypted"
  name              = "${var.environment}-push-notification-topic"
}

data "aws_iam_policy_document" "sns_topic_policy" {
  statement {
    sid     = "AllowLambdaPublish"
    effect  = "Allow"
    actions = ["sns:Publish"]
    principals {
      type        = "AWS"
      identifiers = [module.lambda["send-push-notification"].role_arn]
    }
    resources = [aws_sns_topic.push_notification.arn]
  }
}

resource "aws_sns_topic_policy" "push_notification" {
  arn    = aws_sns_topic.push_notification.arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
}
