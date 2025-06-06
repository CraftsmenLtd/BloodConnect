locals {
  lambda_options = {
    autocomplete = {
      name                       = "get-place-auto-complete"
      handler                    = "getPlaceAutoComplete.default"
      js_file_name               = "getPlaceAutoComplete.js"
      statement                  = local.policies.common_policies
      invocation_arn_placeholder = "GET_PLACE_AUTO_COMPLETE_INVOCATION_ARN"
      env_variables = {
        GOOGLE_MAPS_API_KEY = var.google_maps_api_key
      }
    },
    geocode = {
      name                       = "get-geo-code"
      handler                    = "getGeoCode.default"
      js_file_name               = "getGeoCode.js"
      statement                  = local.policies.common_policies,
      invocation_arn_placeholder = "GET_GEO_CODE_INVOCATION_ARN"
      env_variables = {
        GOOGLE_MAPS_API_KEY = var.google_maps_api_key
      }
    }
  }
}
