resource "aws_cloudfront_distribution" "cdn" {
  #checkov:skip=CKV_AWS_68: "CloudFront Distribution should have WAF enabled"
  #checkov:skip=CKV2_AWS_47: "CloudFront Distribution should have WAF enabled"
  origin {
    domain_name = aws_s3_bucket.static_site.bucket_regional_domain_name
    origin_id   = "S3PrimaryOrigin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  origin {
    domain_name = aws_s3_bucket.cloudfront_failover_bucket.bucket_regional_domain_name
    origin_id   = "S3FailoverOrigin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }


  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for front-end site"
  default_root_object = "index.html"

  origin_group {
    origin_id = "OriginGroup"

    failover_criteria {
      status_codes = [403, 404, 500, 502, 503, 504]
    }

    member {
      origin_id = "S3PrimaryOrigin"
    }

    member {
      origin_id = "S3FailoverOrigin"
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-Static-Site"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    response_headers_policy_id = var.cloudfront_response_policy_id
  }

  price_class = "PriceClass_100"

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.certificate.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2018"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.log_store.bucket_domain_name
    prefix          = "bloodConnect"
  }
}

data "aws_acm_certificate" "certificate" {
  domain      = var.domain_name
  statuses    = ["ISSUED"]
  most_recent = true
}

resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for S3 Static Site"
}
