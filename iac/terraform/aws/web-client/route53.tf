locals {
  web-client-domain = "${var.environment}.${var.base_domain_name}"
}

resource "aws_route53_zone" "main" {
  name = var.base_domain_name
}

resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.web-client-domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}


resource "aws_cloudtrail" "route53_dns_trail" {
  name                          = "route53-dns-queries"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_bucket.bucket
  is_multi_region_trail         = true
  enable_logging                = true
  include_global_service_events = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  cloud_watch_logs_group_arn = aws_cloudwatch_log_group.cloudtrail_log_group.arn
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_role.arn

  tags = {
    Name = "Route 53 DNS Query Trail"
  }
}
