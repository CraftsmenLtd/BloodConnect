locals {
  max_geohash_cache_entries_count         = 10000
  max_geohash_cache_mb_size               = 100
  max_geohash_cache_timeout_minutes       = 20
  max_geohash_neighbor_search_level       = 70
  cache_geohash_prefix_length             = 6
  neighbor_search_geohash_prefix_length   = 7
  max_geohashes_per_execution             = 1024
  donor_search_max_retry_count            = 10
  donor_search_max_reinstated_retry_count = 3
  donor_search_queue_min_delay_seconds    = 300
}
