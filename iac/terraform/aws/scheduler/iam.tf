resource "aws_iam_role" "scheduler_execution_role" {
  name = "${var.environment}-scheduler-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "scheduler_execution_policy" {
  name        = "${var.environment}-scheduler-execution-policy"
  description = "Policy allowing EventBridge Scheduler to invoke Lambda functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          var.donor_search_lambda_arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "scheduler_execution_policy_attachment" {
  role       = aws_iam_role.scheduler_execution_role.name
  policy_arn = aws_iam_policy.scheduler_execution_policy.arn
}