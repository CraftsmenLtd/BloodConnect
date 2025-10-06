output "eventbridge_pipe_arn" {
  value = aws_pipes_pipe.donation_request_pipe.arn
}

output "eventbridge_pipe_name" {
  value = aws_pipes_pipe.donation_request_pipe.name
}
