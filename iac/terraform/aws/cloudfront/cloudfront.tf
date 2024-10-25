resource "aws_cloudfront_distribution" "cdn" {
  #checkov:skip=CKV_AWS_68: "CloudFront Distribution should have WAF enabled"
  #checkov:skip=CKV2_AWS_47: "CloudFront Distribution should have WAF enabled"
  #checkov:skip=CKV_AWS_86: "Ensure Cloudfront distribution has Access Logging enabled"
  #checkov:skip=CKV2_AWS_32: "Ensure CloudFront distribution has a response headers policy attached"

  aliases             = [var.bloodconnect_environment_domain]
  enabled             = true
  is_ipv6_enabled     = false
  comment             = "CloudFront distribution for front-end site"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  wait_for_deployment = var.environment == module.environments.PRODUCTION ? true : false

  # S3 Primary Origin (Static Site)
  origin {
    domain_name = var.static_site_bucket.bucket_regional_domain_name
    origin_id   = var.cloudfront_distribution_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.s3_static_bucket_oai.cloudfront_access_identity_path
    }
  }

  # S3 Failover Origin
  origin {
    domain_name = var.failover_bucket.bucket_regional_domain_name
    origin_id   = var.cloudfront_distribution_failover_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.s3_static_bucket_oai.cloudfront_access_identity_path
    }
  }

  # API Gateway Origin (for /api routes)
  origin {
    domain_name = "${var.rest_api_id}.execute-api.${data.aws_region.current.name}.amazonaws.com"
    origin_id   = var.cloudfront_distribution_apigateway_origin_id

    custom_origin_config {
      origin_protocol_policy = "https-only"
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin_group {
    origin_id = "${var.environment}-OriginGroupId"

    failover_criteria {
      status_codes = [400, 403, 404, 500, 502, 503, 504]
    }

    member {
      origin_id = var.cloudfront_distribution_origin_id
    }

    member {
      origin_id = var.cloudfront_distribution_failover_origin_id
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "${var.environment}-OriginGroupId"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    response_headers_policy_id = var.cloudfront_header_response_policy_id
  }

  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = var.cloudfront_distribution_apigateway_origin_id
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      cookies {
        forward = "all"
      }
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2018"
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.cloudfront_access_region
    }
  }
}

resource "aws_cloudfront_origin_access_identity" "s3_static_bucket_oai" {
  comment = "OAI for S3 Static Site"
}
