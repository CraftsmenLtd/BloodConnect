resource "aws_cognito_user_pool" "user_pool" {
  name = "${var.environment}-user-pool"

  schema {
    attribute_data_type      = "String"
    name                     = "email"
    required                 = true
    mutable                  = true
    developer_only_attribute = false
    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  schema {
    attribute_data_type      = "String"
    name                     = "name"
    required                 = true
    mutable                  = true
    developer_only_attribute = false
    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  schema {
    attribute_data_type      = "String"
    name                     = "phone_number"
    required                 = false
    mutable                  = true
    developer_only_attribute = false
    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  schema {
    attribute_data_type      = "String"
    name                     = "userId"
    required                 = false
    mutable                  = true
    developer_only_attribute = false
    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]

  lambda_config {
    custom_message      = module.lambda["cognito_custom_message_trigger"].lambda_arn
    post_confirmation   = module.lambda["cognito_post_confirmation_trigger"].lambda_arn
    post_authentication = module.lambda["cognito_post_authentication_trigger"].lambda_arn
  }

  password_policy {
    minimum_length    = var.password_length
    require_lowercase = true
    require_numbers   = true
    require_uppercase = false
    require_symbols   = true
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = "Your verification code is {####}."
    email_subject        = "Your Verification Code"
  }

  mfa_configuration = "OFF"

  email_configuration {
    email_sending_account = "DEVELOPER"
    from_email_address    = "no-reply@${var.bloodconnect_domain}"
    source_arn            = var.verified_domain_arn
  }
}

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.user_pool.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id                     = var.google_client_id
    client_secret                 = var.google_client_secret
    authorize_scopes              = "openid email profile"
    attributes_url                = "https://people.googleapis.com/v1/people/me?personFields="
    attributes_url_add_attributes = "true"
    authorize_url                 = "https://accounts.google.com/o/oauth2/v2/auth"
    oidc_issuer                   = "https://accounts.google.com"
    token_request_method          = "POST"
    token_url                     = "https://www.googleapis.com/oauth2/v4/token"
  }

  attribute_mapping = {
    email          = "email"
    name           = "name"
    phone_number   = "phone_number"
    email_verified = "email_verified"
    username       = "sub"
  }
}

resource "aws_cognito_identity_provider" "facebook" {
  user_pool_id  = aws_cognito_user_pool.user_pool.id
  provider_name = "Facebook"
  provider_type = "Facebook"
  provider_details = {
    client_id                     = var.facebook_client_id
    client_secret                 = var.facebook_client_secret
    authorize_scopes              = "public_profile,email"
    attributes_url                = "https://graph.facebook.com/v21.0/me?fields="
    attributes_url_add_attributes = "true"
    authorize_url                 = "https://www.facebook.com/v21.0/dialog/oauth"
    token_request_method          = "GET"
    token_url                     = "https://graph.facebook.com/v21.0/oauth/access_token"
  }
  attribute_mapping = {
    email    = "email"
    name     = "name"
    username = "id"
  }
}

resource "aws_cognito_user_pool_domain" "custom_domain" {
  domain          = local.cognito_domain_name
  user_pool_id    = aws_cognito_user_pool.user_pool.id
  certificate_arn = var.acm_certificate_arn
}

resource "aws_cognito_user_pool_domain" "cognito_domain" {
  domain       = local.cognito_old_domain_name
  user_pool_id = aws_cognito_user_pool.user_pool.id
}

resource "aws_cognito_user_pool_client" "app_pool_client" {
  name                                 = "${var.environment}-app-pool-client"
  user_pool_id                         = aws_cognito_user_pool.user_pool.id
  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  allowed_oauth_flows                  = ["code"]
  callback_urls                        = ["bloodconnect://callback"]
  logout_urls                          = ["bloodconnect://signout"]
  supported_identity_providers         = ["COGNITO", "Google", "Facebook"]
  explicit_auth_flows                  = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"]

  depends_on = [
    aws_cognito_identity_provider.google,
    aws_cognito_identity_provider.facebook
  ]
}

resource "aws_cognito_user_group" "user_group" {
  user_pool_id = aws_cognito_user_pool.user_pool.id
  name         = "user"
  description  = "Standard user group"
}

resource "aws_cognito_user_group" "organization_group" {
  user_pool_id = aws_cognito_user_pool.user_pool.id
  name         = "organization"
  description  = "Organization user group"
}

resource "aws_cognito_user_group" "maintainers_user_group" {
  user_pool_id = aws_cognito_user_pool.user_pool.id
  name         = "maintainer"
  description  = "Organization user group"
}

resource "aws_cognito_user_pool_client" "monitoring_pool_client" {
  name                                 = "${var.environment}-monitoring-pool-client"
  user_pool_id                         = aws_cognito_user_pool.user_pool.id
  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  allowed_oauth_flows                  = ["code"]
  explicit_auth_flows                  = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"]
  supported_identity_providers         = ["COGNITO", "Google", "Facebook"]
  callback_urls                        = ["https://${local.environment_aware_domain}/${var.monitoring_site_path}/index.html"]
  logout_urls                          = ["https://${local.environment_aware_domain}/${var.monitoring_site_path}/index.html"]

  depends_on = [
    aws_cognito_identity_provider.google,
    aws_cognito_identity_provider.facebook
  ]
}

resource "aws_cognito_identity_pool" "maintainers" {
  identity_pool_name               = "${var.environment}-maintainers-id-pool"
  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.monitoring_pool_client.id
    provider_name           = aws_cognito_user_pool.user_pool.endpoint
    server_side_token_check = true
  }
}

resource "aws_iam_role" "maintainers_role" {
  name = "${var.environment}-maintainers-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.maintainers.id
          }

          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" : "authenticated"
          }
        }
      }
    ]
  })
}

resource "aws_cognito_identity_pool_roles_attachment" "identity_pool_roles" {
  identity_pool_id = aws_cognito_identity_pool.maintainers.id

  role_mapping {
    identity_provider         = "cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.user_pool.id}:${aws_cognito_user_pool_client.monitoring_pool_client.id}"
    ambiguous_role_resolution = "Deny"
    type                      = "Rules"

    mapping_rule {
      claim      = "cognito:groups"
      match_type = "Contains"
      role_arn   = aws_iam_role.maintainers_role.arn
      value      = aws_cognito_user_group.maintainers_user_group.name
    }
  }

  roles = {
    authenticated = aws_iam_role.maintainers_role.arn
  }
}
