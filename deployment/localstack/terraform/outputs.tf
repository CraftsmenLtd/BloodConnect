output "aws_invoke_base_url" {
  // source: https://docs.localstack.cloud/user-guide/aws/apigateway/
  value = "http://${module.aws.rest_api_id}.execute-api.localhost.localstack.cloud:4566/${module.aws.api_deployment_stage_name}"
}
