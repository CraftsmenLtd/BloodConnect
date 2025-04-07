locals {
  is_production = var.environment == module.environments.PRODUCTION
  max_geohash_cache_entries_count               = 10000
  max_geohash_cache_mb_size                     = 100
  max_geohash_cache_timeout_minutes             = 20
  max_geohash_neighbor_search_level             = 70
  cache_geohash_prefix_length                   = 6
  neighbor_search_geohash_prefix_length         = 7
  max_geohashes_per_execution                   = local.is_production ? 2048 : 8192
  donor_search_max_initiating_retry_count       = 5
  donor_search_queue_min_delay_seconds          = 300
  donor_search_queue_visibility_timeout_seconds = 240
}
