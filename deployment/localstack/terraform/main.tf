module "aws" {
  source                 = "../../../iac/terraform/aws"
  environment            = "localstack"
  bloodconnect_domain    = "example.com"
  google_client_id       = var.google_client_id
  google_client_secret   = var.google_client_secret
  facebook_client_id     = var.facebook_client_id
  facebook_client_secret = var.facebook_client_secret
  firebase_token_s3_url  = var.firebase_token_s3_url


  providers = {
    aws.us-east-1 = aws.us-east-1
  }
  depends_on = [aws_acm_certificate.ssl_certificate_localstack, aws_route53_zone.main]
}
