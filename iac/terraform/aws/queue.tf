# resource "aws_sqs_queue" "donor_search_queue" {
#   #checkov:skip=CKV_AWS_27: "Ensure all data stored in the SQS queue is encrypted"
#   name                      = "${var.environment}-donor-search-queue"
#   delay_seconds             = 0
#   max_message_size          = 262144
#   message_retention_seconds = 86400
#   receive_wait_time_seconds = 10
# }

# resource "aws_sqs_queue_policy" "donor_search_queue_policy" {
#   queue_url = aws_sqs_queue.donor_search_queue.id

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid    = "AllowEventBridgePipeSendMessage"
#         Effect = "Allow"
#         Principal = {
#           Service = "pipes.amazonaws.com"
#         }
#         Action   = "sqs:SendMessage"
#         Resource = aws_sqs_queue.donor_search_queue.arn
#       }
#     ]
#   })
# }
