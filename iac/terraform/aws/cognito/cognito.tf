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
    custom_message    = module.lambda["cognito_custom_message_trigger"].lambda_arn
    post_confirmation = module.lambda["cognito_post_confirmation_trigger"].lambda_arn
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
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "openid email profile"
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
    client_id        = var.facebook_client_id
    client_secret    = var.facebook_client_secret
    authorize_scopes = "public_profile,email"
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
