resource "aws_cognito_user_pool" "user_pool" {
  name = "${var.environment}-user-pool"

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = false
  }

  schema {
    attribute_data_type = "String"
    name                = "name"
    required            = true
    mutable             = true
  }

  schema {
    attribute_data_type = "String"
    name                = "phone_number"
    required            = true
    mutable             = true
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

resource "aws_cognito_user_pool_client" "app_pool_client" {
  name                                 = "${var.environment}-app-pool-client"
  user_pool_id                         = aws_cognito_user_pool.user_pool.id
  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email"]
  callback_urls                        = ["myapp://callback"]
  logout_urls                          = ["myapp://signout"]
  supported_identity_providers         = ["COGNITO"]
  explicit_auth_flows                  = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"]
}
