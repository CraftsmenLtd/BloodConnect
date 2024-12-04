locals {
  max_geohash_cache_entries_count = 10000
  max_geohash_cache_mb_size = 100
  max_geohash_cache_timeout_minutes = 20
  max_geohash_neighbor_search_level = 50
  cache_geohash_prefix_length = 6
  neighbor_search_geohash_prefix_length = 7
  max_geohashes_per_processing_batch = 128
}
