# Performance Test Instructions — In-app Chat

## Targets (from NFRs)
- Real-time delivery to connected participants **< 1 s** (NFR-U3-P1).
- History query bounded: single DynamoDB query, `Limit ≤ 20`.
- Rate limit: **≤ 60 messages/min per (channel, sender)** enforced server-side (NFR-3).
- Stream consumer: per-record bounded work; partial-batch-failure prevents shard stalls.

## Rate-limit verification (functional perf)
```bash
# send > 60 messages within a minute over WS for one channel/sender:
# expect throttling (ChatThrottlingError / 429) once the per-minute counter exceeds 60.
```
- The fixed 1-minute window bounds throughput to ~60/min (worst-case edge burst ~120) — acceptable per
  the agreed design; tighten to a sliding window in a hardening follow-up if needed.

## WebSocket delivery latency
- With 2 connected clients, measure send→receive round-trip; expect < 1 s on a warm Lambda.
- Watch for cold-start spikes on `chat-send-message`; consider provisioned concurrency only if needed.

## History pagination
- Verify `GET /chat/history` returns ≤ 20 items + `nextCursor`; paginate a channel with > 100 messages;
  each page is a single bounded query (no scans).

## Load tooling (optional)
- `k6` / `artillery` for REST history/channels; a small Node WS client loop for the WebSocket path.
- DynamoDB is on-demand; watch consumed capacity + throttling under load.

## Notes
- No dedicated perf suite is shipped; these are the checks to run under load in a dev stage. Capacity is
  on-demand, so scaling is automatic; the main risks are Lambda cold starts and a single very hot channel
  partition (bounded by the rate limit).
