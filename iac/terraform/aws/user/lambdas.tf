locals {
  # User profile pictures live under a common path inside the shared media bucket.
  avatar_object_prefix = "${var.media_path}/user-images"

  lambda_options = {
    update-user = {
      name                       = "update-user"
      handler                    = "updateUser.default"
      js_file_name               = "updateUser.js"
      statement                  = concat(local.policies.common_policies, local.policies.dynamodb_policy)
      invocation_arn_placeholder = "UPDATE_USER_INVOCATION_ARN"
      env_variables = {
        DYNAMODB_TABLE_NAME          = split("/", var.dynamodb_table_arn)[1]
        MIN_MONTHS_BETWEEN_DONATIONS = var.min_months_between_donations
      }
    },
    create-user = {
      name                       = "create-user"
      handler                    = "createUser.default"
      js_file_name               = "createUser.js"
      statement                  = concat(local.policies.common_policies, local.policies.dynamodb_policy)
      invocation_arn_placeholder = "CREATE_USER_INVOCATION_ARN"
      env_variables = {
        DYNAMODB_TABLE_NAME          = split("/", var.dynamodb_table_arn)[1]
        MIN_MONTHS_BETWEEN_DONATIONS = var.min_months_between_donations
      }
    },
    profile-picture-upload-url = {
      name         = "profile-picture-upload-url"
      handler      = "getProfilePictureUploadUrl.default"
      js_file_name = "getProfilePictureUploadUrl.js"
      statement = concat(local.policies.common_policies, [
        {
          sid       = "AvatarPutObject"
          actions   = ["s3:PutObject"]
          resources = ["${var.media_bucket_arn}/${local.avatar_object_prefix}/*"]
        }
      ])
      invocation_arn_placeholder = "PROFILE_PICTURE_UPLOAD_URL_INVOCATION_ARN"
      env_variables = {
        MEDIA_BUCKET_NAME    = var.media_bucket_name
        MEDIA_CDN_BASE_URL   = "https://${var.bloodconnect_environment_domain}"
        AVATAR_OBJECT_PREFIX = local.avatar_object_prefix
      }
    }
  }
}
