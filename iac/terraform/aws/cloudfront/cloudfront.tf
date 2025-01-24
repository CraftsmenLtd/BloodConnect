resource "aws_cloudformation_stack" "cdn" {
  #checkov:skip=CKV_AWS_124: "Ensure that CloudFormation stacks are sending event notifications to an SNS topic"

  name          = "cloudfront-stack-${var.environment}"
  template_body = file("../../../iac/terraform/aws/cloudfront/cloudfront_template.json")
  capabilities  = ["CAPABILITY_IAM"]

  parameters = {
    BloodconnectEnvironmentDomain            = var.bloodconnect_environment_domain
    StaticSiteBucketDomainName               = var.static_site_bucket.bucket_regional_domain_name
    CloudFrontDistributionOriginId           = var.cloudfront_distribution_origin_id
    FailoverBucketDomainName                 = var.failover_bucket.bucket_regional_domain_name
    CloudFrontDistributionFailoverOriginId   = var.cloudfront_distribution_failover_origin_id
    RestApiId                                = var.rest_api_id
    CloudFrontDistributionApiGatewayOriginId = var.cloudfront_distribution_apigateway_origin_id
    Environment                              = var.environment
    CloudFrontHeaderResponsePolicyId         = var.cloudfront_header_response_policy_id
    AcmCertificateArn                        = var.acm_certificate_arn
    OAIPath                                  = aws_cloudfront_origin_access_identity.s3_static_bucket_oai.cloudfront_access_identity_path
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudfront_origin_access_identity" "s3_static_bucket_oai" {
  comment = "OAI for S3 Static Site"
}
