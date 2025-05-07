module "aws" {
  source                 = "../../../iac/terraform/aws"
  environment            = var.aws_environment
  bloodconnect_domain    = var.bloodconnect_domain
  google_client_id       = var.google_client_id
  google_client_secret   = var.google_client_secret
  facebook_client_id     = var.facebook_client_id
  facebook_client_secret = var.facebook_client_secret
  firebase_token_s3_url  = var.firebase_token_s3_url
  google_maps_api_key    = var.google_maps_api_key
  mapbox_public_key      = var.mapbox_public_key

  providers = {
    aws.us-east-1 = aws.us-east-1
  }
}
