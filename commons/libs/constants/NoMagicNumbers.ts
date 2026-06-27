export const MAX_LOCAL_CACHE_SIZE_COUNT = 1000
export const RADIUS_OF_EARTH = 6378
export const MAX_QUEUE_VISIBILITY_TIMEOUT_SECONDS = 11 * 60 * 60

// H3 resolutions. Schema-coupled. Changing requires GSI key rewrite + data backfill.
export const H3_DONOR_SEARCH_RESOLUTION = 8 // LOC GSI1 partition + ring walk
export const H3_PUBLIC_FEED_RESOLUTION = 5 // REQ GSI1 partition for nearby posts
export const H3_FINE_RESOLUTION = 10 // stored on rows for distance refine

// Donor search wave tunables
export const MAX_CELLS_PER_EXECUTION = 500
export const SEARCH_INTERVAL_SECONDS = 180
export const INITIAL_WAVE_DELAY_SECONDS = 0
export const RETRY_DELAY_SECONDS = 300
export const MAX_RETRIES = 3
export const ACCEPTANCE_WINDOW_SECONDS = 3600
export const MAX_SEARCH_RADIUS_KM = 15
export const PARALLEL_QUERY_CONCURRENCY = 25
export const ELIGIBILITY_WAIT_DAYS = 90

// Public post feed
export const FEED_MAX_RADIUS_KM = 50
export const FEED_DEFAULT_RADIUS_KM = 10

// H3 res 5 edge length used by feed disk math
export const H3_RES_5_EDGE_KM = 8.54
// H3 res 8 edge length used by donor search reach math
export const H3_RES_8_EDGE_KM = 0.461

// Chat tunables
export const CHAT_MESSAGE_RETENTION_DAYS = 90
export const CHAT_RATE_LIMIT_PER_MINUTE = 60
export const WS_CONNECTION_TTL_HOURS = 24
