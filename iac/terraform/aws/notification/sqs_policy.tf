data "aws_iam_policy_document" "sqs_queue_policy" {
  statement {
    sid     = "AllowLambdaSendMessage"
    effect  = "Allow"
    actions = ["sqs:SendMessage"]
    principals {
      type        = "AWS"
      identifiers = [module.lambda["send-push-notification"].role_arn]
    }
    resources = [aws_sqs_queue.push_notification_queue.arn]
  }
}

resource "aws_sqs_queue_policy" "push_notification_queue" {
  queue_url = aws_sqs_queue.push_notification_queue.url
  policy    = data.aws_iam_policy_document.sqs_queue_policy.json
}
